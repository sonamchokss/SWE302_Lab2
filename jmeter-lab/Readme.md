# SWE302 Lab 6: JMeter Performance Test

Performance test of the CST Student Management System (Node.js / Express) using Apache JMeter 5.6.3.

## 1. Folder contents

```
jmeter-lab/
  performance_test.jmx        JMeter test plan
  README.md                   this file
  data/
    students.csv              12 rows, used for functional checks (header row included)
    load_students.csv         5000 unique rows, used for load runs (no header row)
  results/                    raw .jtl result file for every run
  reports/                    generated HTML dashboard for every run
  reset-db.ps1                database reset script (Docker/PostgreSQL only, not used)
cst-sms/                      application source (or project reference given to the tutor)
```

## 2. Requirements

- Java (JDK 17 used here; JMeter 5.6.3 needs Java 8 or later)
- Apache JMeter 5.6.3, extracted to `C:\apache-jmeter-5.6.3`
- Node.js and the project dependencies (`npm install` once in the application folder)

## 3. Start the application

The app runs in **in-memory mode**: data lives in memory and is lost when the app stops. Make sure `DATABASE_URL` is not set.

```
cd cst-sms
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
npm start
```

Expected output: `CST SMS server running on http://localhost:3000`

Demo accounts used by the test: admin `00000001` / `Admin123` (login is done as admin because `POST /api/students` and `POST /api/results` need it).

## 4. Prepare data

`data/load_students.csv` holds 5000 unique students (IDs `02300001` to `02305000`). To regenerate it (PowerShell):

```
$out = "jmeter-lab\data\load_students.csv"
1..5000 | ForEach-Object { "0230{0:D4},Load Tester,load{1}@example.edu,BIT" -f $_, $_ } | Set-Content -Encoding ascii $out
```

In the plan, **CSV Data Set Config** uses: variable names `student_id,full_name,email,program`, Ignore first line = False, Recycle on EOF = False, Stop thread on EOF = True, Sharing mode = All threads. Each student can only be created once per app start, so data must be reset before every run.

The CSV path in the `.jmx` is absolute (`C:\Users\Dell\Desktop\cst-sms\jmeter-lab\data\...`). On another computer, open the plan and change the CSV Data Set Config Filename to your own path, or to `data/load_students.csv` if the `.jmx` is saved in the `jmeter-lab` folder.

## 5. Restore state before every run

1. Stop the application (Ctrl+C).
2. Start it again with `npm start`.

This clears all created students, so the CSV IDs are free again.

## 6. Test plan summary

| Order | Component | Purpose |
| --- | --- | --- |
| 1 | Once Only Controller > `POST Login` | Log in once per user, extract `token` with JSON Extractor |
| 2 | Transaction Controller `Browse and Register Student` | Groups the four requests below |
| 2a | Uniform Random Timer | Think time, 500 to 1000 ms |
| 2b | `GET List Students` | `/api/students`, Duration Assertion 500 ms |
| 2c | `GET View Module` | `/api/modules/SWE302`, Response Assertion |
| 2d | `POST Add Result` | `/api/results`, JSON body |
| 2e | `POST Add Student` | `/api/students`, JSON body from CSV, expects 201 |

Other components: User Defined Variables (`protocol`, `host`, `port`), HTTP Request Defaults, HTTP Header Managers (`Content-Type`, `Authorization: Bearer ${token}`).

## 7. Reproduce each run

Only three Thread Group settings change between levels. In the Thread Group, tick Infinite loops and Specify Thread lifetime, then set:

| Level | Threads | Ramp-up (s) | Duration (s) |
| --- | --- | --- | --- |
| Baseline | 5 | 5 | 65 |
| Moderate | 20 | 10 | 70 |
| Higher | 50 | 20 | 80 |

View Results Tree and Summary Report are disabled for load runs. Close the JMeter GUI, restart the app (section 5), then from `C:\apache-jmeter-5.6.3\bin` run (one line):

```
jmeter.bat -n -t "C:\Users\Dell\Desktop\cst-sms\jmeter-lab\performance_test.jmx" -l "C:\Users\Dell\Desktop\cst-sms\jmeter-lab\results\baseline_run1.jtl" -e -o "C:\Users\Dell\Desktop\cst-sms\jmeter-lab\reports\baseline_run1"
```

Repeat for `baseline_run2`, `moderate_run1`, `moderate_run2`, `higher_run1`, `higher_run2`. Use a new `.jtl` name and a new, empty report folder every time. Open `reports\<run>\index.html` to view the dashboard.

Focused comparison: [describe the experiment, e.g. think time 500 to 1000 ms vs 2000 to 3000 ms, which setting was changed, and the run names].

## 8. Notes

- Application and JMeter ran on the same laptop, so they compete for CPU and memory; results are indicative only.
- Statistics in the reports include the ramp-up period for every run.
- The deliberate assertion-failure test (wrong expected text on `GET View Module`) was run separately in the GUI and is not part of any measured run.