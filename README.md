# LEAP Project Review

An Angular application for recording team results against the Project Checklist. The app autosaves changes in the current browser on the current device. To keep a portable copy or commit review data to Git, export the results backup and team configuration as separate JSON files.

## Run the application

Requirements: Node.js and npm.

From the project folder, install dependencies and start the development server:

```text
npm ci
npm start
```

Open the local address printed by Angular in the terminal.

To verify a production build:

```text
npm run build
```

## Save exports in the project folder

Create a `data` folder in the project root. This folder is intentionally not excluded by `.gitignore`.

1. Run the app and open the team settings. Select **Export config** and choose the project's `data` folder in the Save As dialog. Save it as `team-config.json`.
2. Select **Export** in the top toolbar. Choose the same `data` folder and save the results as `review-backup.json`.
3. Save both files into the same local clone of the project—the folder containing `package.json` and `.gitignore`—for example:
   - `data/team-config.json`
   - `data/review-backup.json`
4. Repeat both exports after making changes, replacing the existing files so Git tracks the latest snapshot rather than a collection of dated copies.

The Save As dialog suggests date-stamped names. You can replace the suggested name with the stable names above. If the browser does not support the Save As picker, the export downloads through the browser; move the downloaded JSON file into the project's `data` folder yourself.

The team configuration and results backup are separate files. When loading them in the app, load the team configuration first, then the results backup. Keep the team IDs in the configuration intact so saved results continue to match the correct teams.

Browser autosave and JSON exports are separate: changes are autosaved in browser storage, but they are not written to the project files until you export them. Commit the JSON files after exporting to preserve the latest results in Git.

## Commit the review data

After exporting both files into `data`, run these commands from the project folder:

```text
git status --short
git add .\data\team-config.json .\data\review-backup.json
git commit -m "Save review results"
git push
```

If Git reports that the current branch has no upstream yet, set one with:

```text
git push -u origin HEAD
```

Review data may contain sensitive information. Use a private repository and confirm that committing the data is permitted for your organization.

## Clone the project and push it to a new repository

Create a new, empty private repository on your Git hosting service. Copy its clone URL, then replace the placeholders below with the clone URLs provided by your source and destination repositories. Do not include the angle brackets in the commands.

```text
git clone <SOURCE_REPOSITORY_URL> leap-review-ratings
cd leap-review-ratings
git remote rename origin upstream
git remote add origin <NEW_REPOSITORY_URL>
git remote -v
git push -u origin HEAD
```

This keeps the original repository as `upstream` and uses the new repository as `origin`. To use only the new repository instead, you can leave the remote named `origin` and change its URL with:

```text
git remote set-url origin <NEW_REPOSITORY_URL>
git remote -v
git push -u origin HEAD
```

After cloning, create the project's `data` folder, run the app, export the two JSON files there, then commit and push them using the commands above. Git remotes do not automatically receive browser data; the exported files must be committed and pushed.
