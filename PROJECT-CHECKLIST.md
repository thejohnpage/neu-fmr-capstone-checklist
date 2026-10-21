
## Project checklist

### OVERALL RATING

| Team | Rating |
| -- |:------:|
| JL| 🔍 |
| LOL | 🔍 |
| AOL| 🔍 |
| CAD| 🔍 |

**Key**

* ⭐️ - ⭐️⭐️⭐️⭐️⭐️ - Meets criteria
* ❌ / 🏈 - Does not meet; Must / Should or Opt
* ❓ (⁉️) - john is confused (VERY confused)
* 🔍 - john to review further


### Login & security

| JL| LOL| AOL| CAD| Evaluation item | Priority | 
|:------:|:-------:|:------:|:-----:| --------------- | -------- |
|  |  |  |  | Client registration & secure sign-in; BR-01 | Must |    
|  |  |  |  | Client can access only their own positions, cash and orders; BR-02 | Must |
|  |  |  |  | Sessions time-limited and revocable; BR-03 | Should |
|  |  |  |  | Account lock after 3 failed sign-in attempts; BR-03 | Should |
|  |  |  |  | JWT expires < 5 minutes; BR-03 | Should |
| ---| --- | --- | --- | ------------------------ | --- |
| 🔍 | 🔍 | 🔍 | 🔍 | SECTION RATING | Critical |


### Holdings & orders

| JL| LOL| AOL| CAD| Evaluation item | Priority | 
|:------:|:-------:|:------:|:-----:| --------------- | -------- |
|  |  |  |  | Submit buy or sell order for supported instrument; BR-04 | Must |
|  |  |  |  | Validate cash, holdings and tradability before accepting; BR-05 | Must |
|  |  |  |  | Market hours are honored; BR-05 | Must |
|  |  |  |  | Persist accepted order before separate execution, including failures; BR-06 | Must |
|  |  |  |  | Status transitioned being persisted & displayed; BR-07 | Should |
|  |  |  |  | Price against current quote at execution and fill/reject; BR-08 | Must |
|  |  |  |  | Update holdings, cash and permanent trade record atomically; BR-09 | Must |
|  |  |  |  | Show accurate current holdings and cash balance; BR-10 | Must |
|  |  |  |  | Show chronological history of own orders and fills; BR-11 | Must |
|  |  |  |  | History pagination; BR-11 | Opt |
|  |  |  |  | Current market pricing for multiple exchanges; BR-12 | Must |
|  |  |  |  | Show indicative price before submitting order; BR-13 | Should |
|  |  |  |  | Market-limit order; BR-13 | Should |
|  |  |  |  | Open limit order; BR-13 | Opt |
| ---| --- | --- | --- | ------------------------ | --- |
| 🔍 | 🔍 | 🔍 | 🔍 | SECTION RATING | Critical |


### Reporting & insights

| JL| LOL| AOL| CAD| Evaluation item | Priority | 
|:------:|:-------:|:------:|:-----:| --------------- | -------- |
|  |  |  |  | Historical analysis independent of live trading; BR-16 | Must |
|  |  |  |  | Analysis performance < 10 second response times; BR-16 | Must |
|  |  |  |  | ETL pipeline should be resilient; BR-16 | Should |
|  |  |  |  | ETL more frequent than daily; BR-16 | Opt |
|  |  |  |  | Quality of internal trading activity insights; BR-17 | Should |
|  |  |  |  | UX richness of reporting interface; BR-17 | Should |
| ---| --- | --- | --- | ------------------------ | --- |
| 🔍 | 🔍 | 🔍 | 🔍 | SECTION RATING | Critical |


### Business administration

| JL| LOL| AOL| CAD| Evaluation item | Priority | 
|:------:|:-------:|:------:|:-----:| --------------- | -------- |
|  |  |  |  | Trading permissions can be revoked; BR-04 | Must |
|  |  |  |  | Additional security admin & reporting; BR-04 | Opt |
|  |  |  |  | Permanent attributable order/pricing/balance audit records surviving failures; BR-14 | Must |
|  |  |  |  | Reconstruct complete trade lifecycle for disputes/audit; BR-15 | Must |
|  |  |  |  | UX richness of reporting interface; BR-15 | Should |
| ---| --- | --- | --- | ------------------------ | --- |
| 🔍 | 🔍 | 🔍 | 🔍 | SECTION RATING | Critical |



### Extra feature(s)

| JL| LOL| AOL| CAD| Evaluation item | Priority | 
|:------:|:-------:|:------:|:-----:| --------------- | -------- |
|  |  |  |  | Build and justify one additional valuable capability; BR-18 | Must |
|  |  |  |  | Watchlist w/shortcut to sell if applicable | Opt |
|  |  |  |  | Search results w/shortcut to sell if applicable | Opt |
|  |  |  |  | Dark mode | Opt |
|  |  |  |  | Basic vs power user view | Opt |
|  |  |  |  | Accessibility features | Opt |
|  |  |  |  | Multi-lingual | Opt |
|  |  |  |  | Multi-currencies; BR-10 | Opt |
|  |  |  |  | Mobile friendly | Opt |
|  |  |  |  | Fee structure like in labs | Opt |
|  |  |  |  | EXTRA FEATURE #2; BR-18 | Opt |
|  |  |  |  | EXTRA FEATURE #3; BR-18 | Opt |
|  |  |  |  | EXTRA FEATURE #4; BR-18 | Opt |
|  |  |  |  | EXTRA FEATURE #5; BR-18 | Opt |
| ---| --- | --- | --- | ------------------------ | --- |
| 🔍 | 🔍 | 🔍 | 🔍 | SECTION RATING | Critical |

**Key**
 
* ⭐️ - ⭐️⭐️⭐️⭐️⭐️ - Meets criteria
* ❌ / 🏈 - Does not meet; Must / Should or Opt
* ❓ (⁉️) - john is confused (VERY confused)
* 🔍 - john to review further
