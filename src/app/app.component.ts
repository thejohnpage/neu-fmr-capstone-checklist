import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import packageInfo from '../../package.json';
import { ReviewMember, ReviewSection, ReviewTeam, RatingValue, RATING_OPTIONS, SECTIONS, TEAMS } from './checklist-data';

interface ReviewBackup {
  format: 'leap-review-ratings';
  version: 1;
  exportedAt: string;
  ratings: Record<string, RatingValue>;
}

interface TeamConfiguration {
  format: 'leap-review-team-config';
  version: 2;
  exportedAt: string;
  teams: ReviewTeam[];
}

interface SectionRatingSummary {
  display: string;
  label: string;
  printValue: string;
  scoreLabel: string;
  isCritical: boolean;
  isWarning: boolean;
  ratedRequiredCount: number;
  requiredCount: number;
  unmetOptionalCount: number;
  optionalCount: number;
}

interface JsonWritableFileStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
}

interface JsonWritableFileHandle {
  createWritable(): Promise<JsonWritableFileStream>;
}

interface JsonFilePickerWindow extends Window {
  showSaveFilePicker?: (options: {
    suggestedName: string;
    types: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<JsonWritableFileHandle>;
}

type SaveState = 'saved' | 'saving' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html'
})
export class AppComponent {
  readonly appVersion = packageInfo.version;
  readonly copyrightYear = new Date().getFullYear();
  teams: ReviewTeam[] = TEAMS.map((team) => ({ ...team, members: [...team.members] }));
  readonly sections = SECTIONS;
  readonly options = RATING_OPTIONS;
  readonly overallRowId = 'overall';
  readonly storageKey = 'leap-review-ratings-v1';
  readonly teamStorageKey = 'leap-review-teams-v1';
  readonly dirtyStateStorageKey = 'leap-review-dirty-state-v1';
  readonly themeStorageKey = 'leap-review-theme-v1';
  theme: 'light' | 'dark' = 'light';
  ratings: Partial<Record<string, RatingValue>> = {};
  saveState: SaveState = 'saved';
  saveMessage = 'Saved on this device';
  selectedFileName = '';
  teamAlias = '';
  teamName = '';
  editingTeamId: string | null = null;
  teamFormOpen = false;
  teamFormError = '';
  draftMembers: ReviewMember[] = [];
  memberName = '';
  memberFormOpen = false;
  editingMemberId: string | null = null;
  memberFormError = '';
  startupModalOpen = true;
  startupImportMessage = '';
  resultsDirty = false;
  configDirty = false;
  private teamModalReturnFocus: HTMLElement | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | undefined;

  @ViewChild('teamAliasInput') private teamAliasInput?: ElementRef<HTMLInputElement>;
  @ViewChild('teamMemberNameInput') private teamMemberNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('teamEditorDialog') private teamEditorDialog?: ElementRef<HTMLElement>;

  constructor() {
    this.loadTheme();
    this.loadSavedTeams();
    this.loadSavedRatings();
    this.loadDirtyState();
  }

  toggleTheme(): void {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset['theme'] = this.theme;
    try {
      localStorage.setItem(this.themeStorageKey, this.theme);
    } catch {
      return;
    }
  }

  get totalRatings(): number {
    return (1 + this.sections.reduce((total, section) => total + section.items.length, 0)) * this.teams.length;
  }

  get completedRatings(): number {
    const validKeys = new Set(this.allRatingKeys());
    return Object.entries(this.ratings).filter(([key, rating]) => validKeys.has(key) && rating !== undefined && rating !== '').length;
  }

  get completionPercent(): number {
    return Math.round((this.completedRatings / this.totalRatings) * 100);
  }

  get teamCountLabel(): string {
    return this.teams.length.toString().padStart(2, '0');
  }

  updateTeamAlias(event: Event): void {
    this.teamAlias = (event.target as HTMLInputElement).value;
    this.teamFormError = '';
  }

  updateTeamName(event: Event): void {
    this.teamName = (event.target as HTMLInputElement).value;
    this.teamFormError = '';
  }

  updateMemberName(event: Event): void {
    this.memberName = (event.target as HTMLInputElement).value;
    this.memberFormError = '';
  }

  continueWithSavedData(): void {
    this.startupModalOpen = false;
  }

  startAddMember(): void {
    this.editingMemberId = null;
    this.memberFormOpen = true;
    this.memberName = '';
    this.memberFormError = '';
    this.focusTeamMemberName();
  }

  startEditMember(member: ReviewMember): void {
    this.editingMemberId = member.id;
    this.memberFormOpen = true;
    this.memberName = member.name;
    this.memberFormError = '';
    this.focusTeamMemberName();
  }

  cancelMemberEdit(): void {
    this.editingMemberId = null;
    this.memberFormOpen = false;
    this.memberName = '';
    this.memberFormError = '';
  }

  saveMember(event: Event): void {
    event.preventDefault();
    const name = this.memberName.trim();
    if (!name) {
      this.memberFormError = 'Enter a member name.';
      return;
    }

    const duplicate = this.draftMembers.some((member) => member.id !== this.editingMemberId && member.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase());
    if (duplicate) {
      this.memberFormError = 'Member names must be unique within the team.';
      return;
    }

    const wasEditing = this.editingMemberId !== null;
    if (this.editingMemberId) {
      this.draftMembers = this.draftMembers.map((member) => member.id === this.editingMemberId ? { ...member, name } : member);
    } else {
      this.draftMembers = [...this.draftMembers, { id: this.createMemberId(), name }];
    }
    if (this.editingTeamId) {
      this.teams = this.teams.map((team) => team.id === this.editingTeamId
        ? { ...team, members: this.draftMembers.map((member) => ({ ...member })) }
        : team);
      this.markConfigDirty();
      this.persistTeams(wasEditing ? 'Team member updated' : 'Team member added');
    }
    this.cancelMemberEdit();
  }

  deleteMember(member: ReviewMember): void {
    this.draftMembers = this.draftMembers.filter((current) => current.id !== member.id);
    if (this.editingTeamId) {
      this.teams = this.teams.map((team) => team.id === this.editingTeamId
        ? { ...team, members: this.draftMembers.map((current) => ({ ...current })) }
        : team);
      this.markConfigDirty();
      this.persistTeams('Team member deleted');
    }
    if (this.editingMemberId === member.id) this.cancelMemberEdit();
  }

  startAddTeam(): void {
    this.captureTeamModalReturnFocus();
    this.editingTeamId = null;
    this.teamFormOpen = true;
    this.teamAlias = '';
    this.teamName = '';
    this.draftMembers = [];
    this.teamFormError = '';
    this.cancelMemberEdit();
    this.focusTeamAlias();
  }

  startEditTeam(team: ReviewTeam): void {
    this.captureTeamModalReturnFocus();
    this.editingTeamId = team.id;
    this.teamFormOpen = true;
    this.teamAlias = team.shortName;
    this.teamName = team.name;
    this.draftMembers = team.members.map((member) => ({ ...member }));
    this.teamFormError = '';
    this.cancelMemberEdit();
    this.focusTeamAlias();
  }

  cancelTeamEdit(): void {
    const shouldRestoreFocus = this.teamFormOpen;
    this.editingTeamId = null;
    this.teamFormOpen = false;
    this.teamAlias = '';
    this.teamName = '';
    this.draftMembers = [];
    this.teamFormError = '';
    this.cancelMemberEdit();
    if (shouldRestoreFocus) {
      const returnFocus = this.teamModalReturnFocus;
      this.teamModalReturnFocus = null;
      window.setTimeout(() => returnFocus?.focus());
    }
  }

  saveTeam(event: Event): void {
    event.preventDefault();
    const alias = this.teamAlias.trim();
    const name = this.teamName.trim();
    if (!alias || !name) {
      this.teamFormError = 'Enter both an alias and a full team name.';
      return;
    }

    const duplicate = this.teams.some((team) => team.id !== this.editingTeamId && (
      team.shortName.trim().toLocaleLowerCase() === alias.toLocaleLowerCase() ||
      team.name.trim().toLocaleLowerCase() === name.toLocaleLowerCase()
    ));
    if (duplicate) {
      this.teamFormError = 'Aliases and full names must each be unique.';
      return;
    }

    const wasEditing = this.editingTeamId !== null;
    const members = this.draftMembers.map((member) => ({ ...member }));
    if (this.editingTeamId) {
      this.teams = this.teams.map((team) => team.id === this.editingTeamId ? { ...team, shortName: alias, name, members } : team);
    } else {
      this.teams = [...this.teams, { id: this.createTeamId(), shortName: alias, name, members }];
    }

    this.cancelTeamEdit();
    this.markConfigDirty();
    this.persistTeams(wasEditing ? 'Team details updated' : 'Team added');
  }

  @HostListener('document:keydown', ['$event'])
  onTeamEditorKeydown(event: KeyboardEvent): void {
    if (!this.teamFormOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancelTeamEdit();
      return;
    }
    if (event.key !== 'Tab') return;

    const dialog = this.teamEditorDialog?.nativeElement;
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled])'))
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  closeTeamEditorFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelTeamEdit();
  }

  private captureTeamModalReturnFocus(): void {
    this.teamModalReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  }

  private focusTeamAlias(): void {
    window.setTimeout(() => this.teamAliasInput?.nativeElement.focus());
  }

  private focusTeamMemberName(): void {
    window.setTimeout(() => this.teamMemberNameInput?.nativeElement.focus());
  }

  deleteTeam(team: ReviewTeam): void {
    if (this.teams.length <= 1) return;
    const teamRatings = Object.keys(this.ratings).filter((key) => key.endsWith(`:${team.id}`));
    const warning = teamRatings.length
      ? `Delete ${team.name} and its ${teamRatings.length} saved rating${teamRatings.length === 1 ? '' : 's'}? This cannot be undone unless you have exported a ratings backup.`
      : `Delete ${team.name}?`;
    if (!window.confirm(warning)) return;

    this.teams = this.teams.filter((candidate) => candidate.id !== team.id);
    for (const key of teamRatings) delete this.ratings[key];
    if (this.editingTeamId === team.id) this.cancelTeamEdit();
    this.markConfigDirty();
    if (teamRatings.length) this.markResultsDirty();
    const ratingsSaved = teamRatings.length === 0 || this.persistRatings('Team and its ratings deleted');
    const teamsSaved = this.persistTeams('Team deleted');
    if (!ratingsSaved || !teamsSaved) this.setStatus('error', 'The team was removed, but some changes could not be saved to browser storage');
  }

  async exportTeamConfig(): Promise<void> {
    const config: TeamConfiguration = {
      format: 'leap-review-team-config',
      version: 2,
      exportedAt: new Date().toISOString(),
      teams: this.teams.map((team) => ({ ...team, members: team.members.map((member) => ({ ...member })) }))
    };
    try {
      const saved = await this.saveJson(config, `leap-team-config-${new Date().toISOString().slice(0, 10)}.json`);
      if (!saved) {
        this.setStatus('saved', 'Team configuration export canceled');
        return;
      }
      this.markConfigClean();
      this.setStatus('saved', 'Team configuration exported');
    } catch {
      this.setStatus('error', 'Could not save the team configuration file');
    }
  }

  async importTeamConfig(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.setStatus('saving', 'Checking team configuration…');
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const importedTeams = this.validateTeamConfig(parsed);
      const importedIds = new Set(importedTeams.map((team) => team.id));
      const removedIds = this.teams.filter((team) => !importedIds.has(team.id)).map((team) => team.id);
      const orphanedRatings = Object.keys(this.ratings).filter((key) => removedIds.some((id) => key.endsWith(`:${id}`)));
      if (orphanedRatings.length && !window.confirm(`This configuration removes ${removedIds.length} team${removedIds.length === 1 ? '' : 's'} with ${orphanedRatings.length} saved rating${orphanedRatings.length === 1 ? '' : 's'}. Those ratings will be deleted. Continue?`)) {
        this.startupImportMessage = 'Team configuration import canceled; existing data was kept.';
        this.setStatus('saved', 'Team configuration import canceled');
        return;
      }

      for (const key of orphanedRatings) delete this.ratings[key];
      this.teams = importedTeams;
      this.cancelTeamEdit();
      this.cancelMemberEdit();
      if (orphanedRatings.length) this.markResultsDirty();
      const ratingsSaved = orphanedRatings.length === 0 || this.persistRatings('Team configuration restored; ratings kept for matching team IDs');
      const teamsSaved = this.persistTeams('Team configuration restored');
      this.markConfigClean();
      this.startupImportMessage = 'Team configuration loaded. Load results after configuration if the team list changed.';
      if (!ratingsSaved || !teamsSaved) this.setStatus('error', 'The configuration was applied, but some changes could not be saved to browser storage');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The selected file could not be read.';
      this.startupImportMessage = message;
      this.setStatus('error', message);
    } finally {
      input.value = '';
    }
  }

  sectionCompleted(section: ReviewSection): number {
    return section.items.reduce((count, item) => count + this.teams.filter((team) => this.ratingFor(`item:${item.id}`, team.id) !== '').length, 0);
  }

  sectionRating(section: ReviewSection, teamId: string): SectionRatingSummary {
    const mustItems = section.items.filter((item) => item.priority === 'Must');
    const shouldItems = section.items.filter((item) => item.priority === 'Should');
    const optionalItems = section.items.filter((item) => item.priority === 'Opt');
    const isFailure = (item: ReviewSection['items'][number]): boolean => {
      const rating = this.ratingFor(`item:${item.id}`, teamId);
      return rating === 'no' || rating === 'football';
    };
    const unmetOptionalCount = optionalItems.filter(isFailure).length;
    const requiredItems = [...mustItems, ...shouldItems];
    const requiredRatings = requiredItems.map((item) => this.ratingFor(`item:${item.id}`, teamId));
    const ratedRequiredCount = requiredRatings.filter((rating) => rating !== '').length;
    const summary = (display: string, label: string, isCritical = false, isWarning = false, scoreLabel = ''): SectionRatingSummary => ({
      display,
      label,
      printValue: `${display} ${label} · Must/Should rated: ${ratedRequiredCount} / ${requiredItems.length}${optionalItems.length > 0 ? ` · Opt unmet: ${unmetOptionalCount} / ${optionalItems.length}` : ''}`,
      scoreLabel,
      isCritical,
      isWarning,
      ratedRequiredCount,
      requiredCount: requiredItems.length,
      unmetOptionalCount,
      optionalCount: optionalItems.length
    });
    if (mustItems.some(isFailure)) return summary('❌', 'Does not meet a Must criterion', true);
    if (shouldItems.some(isFailure)) return summary('🏈', 'Does not meet a Should criterion', false, true);
    if (requiredRatings.includes('confused')) return summary('❓', 'Needs clarification');
    if (requiredRatings.includes('review')) return summary('🔍', 'Review further');

    const scoredRatings = requiredRatings.map(Number).filter((rating) => Number.isFinite(rating) && rating >= 1 && rating <= 5);
    if (scoredRatings.length === 0) return summary('—', 'No Must or Should criteria rated');

    const average = scoredRatings.reduce((total, rating) => total + rating, 0) / scoredRatings.length;
    const roundedRating = Math.round(average);
    const isProvisional = scoredRatings.length < requiredItems.length;
    const completion = `${scoredRatings.length} / ${requiredItems.length} Must and Should criteria rated`;
    const label = isProvisional
      ? `Provisional — ${roundedRating} stars (average ${average.toFixed(1)}; ${completion})`
      : `Meets criteria — ${roundedRating} stars (average ${average.toFixed(1)})`;
    return summary('⭐'.repeat(roundedRating), label, false, false, average.toFixed(1));
  }

  ratingFor(rowId: string, teamId: string): RatingValue {
    return this.ratings[this.ratingKey(rowId, teamId)] ?? '';
  }

  ratingDisplay(rowId: string, teamId: string): string {
    const value = this.ratingFor(rowId, teamId);
    return this.options.find((option) => option.value === value)?.display ?? '—';
  }

  ratingPrintValue(rowId: string, teamId: string): string {
    const value = this.ratingFor(rowId, teamId);
    const option = this.options.find((ratingOption) => ratingOption.value === value);
    return option ? `${option.display} ${option.label}` : '— Not rated';
  }

  exportPdf(): void {
    window.print();
  }

  ratingKey(rowId: string, teamId: string): string {
    return `${rowId}:${teamId}`;
  }

  updateRating(rowId: string, teamId: string, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!this.isRatingValue(value)) return;

    const key = this.ratingKey(rowId, teamId);
    if (value === '') {
      delete this.ratings[key];
    } else {
      this.ratings[key] = value;
    }
    this.markResultsDirty();
    this.persistRatings();
  }

  async exportBackup(): Promise<void> {
    const backup: ReviewBackup = {
      format: 'leap-review-ratings',
      version: 1,
      exportedAt: new Date().toISOString(),
      ratings: this.ratings as Record<string, RatingValue>
    };
    try {
      const saved = await this.saveJson(backup, `leap-review-backup-${new Date().toISOString().slice(0, 10)}.json`);
      if (!saved) {
        this.setStatus('saved', 'Results export canceled');
        return;
      }
      this.markResultsClean();
      this.setStatus('saved', 'Results exported');
    } catch {
      this.setStatus('error', 'Could not save the Project Checklist results file');
    }
  }

  async importBackup(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedFileName = file.name;
    this.setStatus('saving', 'Checking backup…');
    try {
      const parsed: unknown = JSON.parse(await file.text());
      this.ratings = this.validateBackup(parsed);
      this.persistRatings('Backup restored and saved on this device');
      this.markResultsClean();
      this.startupImportMessage = 'Project Checklist results loaded for the active team configuration.';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The selected file could not be read.';
      this.startupImportMessage = message;
      this.setStatus('error', message);
    } finally {
      input.value = '';
    }
  }

  resetRatings(): void {
    if (!window.confirm(`Reset every rating for all ${this.teams.length} teams? This cannot be undone unless you have exported a backup.`)) return;
    this.ratings = {};
    this.markResultsDirty();
    this.persistRatings('Ratings cleared and saved on this device');
    this.selectedFileName = '';
  }

  private loadTheme(): void {
    try {
      const stored = localStorage.getItem(this.themeStorageKey);
      this.theme = stored === 'dark' ? 'dark' : 'light';
    } catch {
      this.theme = 'light';
    }
    document.documentElement.dataset['theme'] = this.theme;
  }

  private loadSavedTeams(): void {
    try {
      const stored = localStorage.getItem(this.teamStorageKey);
      if (!stored) return;
      this.teams = this.validateTeamConfig(JSON.parse(stored));
    } catch {
      this.saveState = 'error';
      this.saveMessage = 'Saved team configuration could not be loaded';
    }
  }

  private loadSavedRatings(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return;
      const parsed: unknown = JSON.parse(stored);
      this.ratings = this.validateStoredRatings(parsed);
      this.saveMessage = this.completedRatings === 0 ? 'Saved on this device' : 'Restored from this device';
    } catch {
      this.saveState = 'error';
      this.saveMessage = 'Saved data could not be loaded';
    }
  }

  private loadDirtyState(): void {
    try {
      const stored = localStorage.getItem(this.dirtyStateStorageKey);
      if (!stored) return;
      const state: unknown = JSON.parse(stored);
      if (!this.isRecord(state)) return;
      this.resultsDirty = state['resultsDirty'] === true;
      this.configDirty = state['configDirty'] === true;
    } catch {
      this.resultsDirty = false;
      this.configDirty = false;
    }
  }

  private persistDirtyState(): void {
    try {
      localStorage.setItem(this.dirtyStateStorageKey, JSON.stringify({ resultsDirty: this.resultsDirty, configDirty: this.configDirty }));
    } catch {
      this.setStatus('error', 'Could not save export status to browser storage');
    }
  }

  private markResultsDirty(): void {
    this.resultsDirty = true;
    this.persistDirtyState();
  }

  private markConfigDirty(): void {
    this.configDirty = true;
    this.persistDirtyState();
  }

  private markResultsClean(): void {
    this.resultsDirty = false;
    this.persistDirtyState();
  }

  private markConfigClean(): void {
    this.configDirty = false;
    this.persistDirtyState();
  }

  @HostListener('window:beforeunload', ['$event'])
  warnBeforeUnload(event: BeforeUnloadEvent): void {
    if (!this.resultsDirty && !this.configDirty) return;
    event.preventDefault();
    event.returnValue = '';
  }

  private persistRatings(successMessage = 'Saved on this device'): boolean {
    this.saveState = 'saving';
    this.saveMessage = 'Saving…';
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.ratings));
      this.setStatus('saved', successMessage);
      return true;
    } catch {
      this.setStatus('error', 'Could not save to browser storage');
      return false;
    }
  }

  private setStatus(state: SaveState, message: string): void {
    this.saveState = state;
    this.saveMessage = message;
    if (this.saveTimer) clearTimeout(this.saveTimer);
    if (state === 'saved' && message === 'Saved on this device') {
      this.saveTimer = setTimeout(() => {
        this.saveMessage = 'All changes saved';
      }, 1800);
    }
  }

  private persistTeams(successMessage: string): boolean {
    try {
      const config: TeamConfiguration = {
        format: 'leap-review-team-config',
        version: 2,
        exportedAt: new Date().toISOString(),
        teams: this.teams.map((team) => ({ ...team, members: team.members.map((member) => ({ ...member })) }))
      };
      localStorage.setItem(this.teamStorageKey, JSON.stringify(config));
      this.setStatus('saved', successMessage);
      return true;
    } catch {
      this.setStatus('error', 'Could not save team configuration to browser storage');
      return false;
    }
  }

  private createTeamId(): string {
    const id = typeof crypto.randomUUID === 'function'
      ? `team-${crypto.randomUUID()}`
      : `team-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.teams.some((team) => team.id === id) ? this.createTeamId() : id;
  }

  private createMemberId(): string {
    const id = typeof crypto.randomUUID === 'function'
      ? `member-${crypto.randomUUID()}`
      : `member-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    return this.teams.some((team) => team.members.some((member) => member.id === id)) ? this.createMemberId() : id;
  }

  private async saveJson(value: unknown, fileName: string): Promise<boolean> {
    const filePicker = (window as JsonFilePickerWindow).showSaveFilePicker;
    if (!filePicker) {
      this.downloadJson(value, fileName);
      return true;
    }

    let fileHandle: JsonWritableFileHandle;
    try {
      fileHandle = await filePicker.call(window, {
        suggestedName: fileName,
        types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }]
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return false;
      throw error;
    }

    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(value, null, 2));
    await writable.close();
    return true;
  }

  private downloadJson(value: unknown, fileName: string): void {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  private validateTeamConfig(value: unknown): ReviewTeam[] {
    if (!this.isRecord(value) || value['format'] !== 'leap-review-team-config' || (value['version'] !== 1 && value['version'] !== 2) || !Array.isArray(value['teams'])) {
      throw new Error('This file is not a supported LEAP team configuration.');
    }
    if (value['teams'].length === 0) throw new Error('A team configuration must contain at least one team.');

    const ids = new Set<string>();
    const aliases = new Set<string>();
    const names = new Set<string>();
    const teams: ReviewTeam[] = [];
    for (const candidate of value['teams']) {
      if (!this.isRecord(candidate) || typeof candidate['id'] !== 'string' || typeof candidate['shortName'] !== 'string' || typeof candidate['name'] !== 'string') {
        throw new Error('The team configuration contains a team with missing or invalid fields.');
      }

      const id = candidate['id'].trim();
      const shortName = candidate['shortName'].trim();
      const name = candidate['name'].trim();
      const normalizedAlias = shortName.toLocaleLowerCase();
      const normalizedName = name.toLocaleLowerCase();
      if (!id || !shortName || !name) throw new Error('Every team must have an ID, alias, and full name.');
      if (ids.has(id) || aliases.has(normalizedAlias) || names.has(normalizedName)) {
        throw new Error('Team IDs, aliases, and full names must each be unique.');
      }

      const rawMembers = candidate['members'];
      if (value['version'] === 2 && !Array.isArray(rawMembers)) throw new Error('Every team in this configuration must include a member list.');
      if (rawMembers !== undefined && !Array.isArray(rawMembers)) throw new Error('A team member list is invalid.');
      const memberIds = new Set<string>();
      const memberNames = new Set<string>();
      const members: ReviewMember[] = [];
      for (const rawMember of Array.isArray(rawMembers) ? rawMembers : []) {
        if (!this.isRecord(rawMember) || typeof rawMember['id'] !== 'string' || typeof rawMember['name'] !== 'string') {
          throw new Error('The team configuration contains a member with missing or invalid fields.');
        }
        const memberId = rawMember['id'].trim();
        const memberName = rawMember['name'].trim();
        const normalizedMemberName = memberName.toLocaleLowerCase();
        if (!memberId || !memberName) throw new Error('Every member must have an ID and a nonblank name.');
        if (memberIds.has(memberId) || memberNames.has(normalizedMemberName)) {
          throw new Error('Member IDs and names must each be unique within a team.');
        }
        memberIds.add(memberId);
        memberNames.add(normalizedMemberName);
        members.push({ id: memberId, name: memberName });
      }

      ids.add(id);
      aliases.add(normalizedAlias);
      names.add(normalizedName);
      teams.push({ id, shortName, name, members });
    }
    return teams;
  }

  private validateBackup(value: unknown): Partial<Record<string, RatingValue>> {
    if (!this.isRecord(value) || value['format'] !== 'leap-review-ratings' || value['version'] !== 1) {
      throw new Error('This file is not a supported LEAP review backup.');
    }
    return this.validateStoredRatings(value['ratings']);
  }

  private validateStoredRatings(value: unknown): Partial<Record<string, RatingValue>> {
    if (!this.isRecord(value)) throw new Error('The backup ratings data is missing or invalid.');
    const validKeys = new Set(this.allRatingKeys());
    const legacySectionKeys = new Set(this.sections.flatMap((section) => this.teams.map((team) => this.ratingKey(`section:${section.id}`, team.id))));
    const restored: Partial<Record<string, RatingValue>> = {};
    for (const [key, rating] of Object.entries(value)) {
      if (legacySectionKeys.has(key)) continue;
      if (!validKeys.has(key) || !this.isRatingValue(rating) || rating === '') {
        throw new Error('The backup contains an unknown rating or checklist row.');
      }
      restored[key] = rating;
    }
    return restored;
  }

  private allRatingKeys(): string[] {
    const rows = [this.overallRowId, ...this.sections.flatMap((section) => section.items.map((item) => `item:${item.id}`))];
    return rows.flatMap((rowId) => this.teams.map((team) => this.ratingKey(rowId, team.id)));
  }

  private isRatingValue(value: unknown): value is RatingValue {
    return typeof value === 'string' && this.options.some((option) => option.value === value);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
