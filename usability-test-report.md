# Usability Test Participant Report

## 1. Task scenarios and success criteria

| Task | Scenario | Success criteria |
|------|----------|------------------|
| T1 | You are a CST student. Log in to the system with the Student ID and password provided. | Student dashboard is reached. |
| T2 | You have paid your tuition fee by mobile banking. Let the college know that you have paid. | Screenshot and transaction number submitted; confirmation shown. |
| T3 | Your semester results are out. Find them and keep a copy on your computer. | Results displayed and PDF downloaded. |
| T4 | Your own task based on the enhancement in this version. | Feature works and the result is measurable. |

## 2. Participant results

| Participant | T1: Login | Time | Result | Errors | T2: Pay Tuition | Time | Result | Errors | T3: Results | Time | Result | Errors | T4: Receipt / Enhanced Feature | Time | Result | Errors |
|-------------|-----------|------|--------|--------|----------------|------|--------|--------|--------------|------|--------|--------|--------------------------------|------|--------|--------|
| Participant (partner) | Student login completed | 00:00:45 | Success | 0 | Uploaded valid screenshot and transaction number; confirmation shown | 00:02:30 | Success | 0 | Viewed grade and downloaded statement | 00:01:20 | Success | 0 | Receipt generated and payment history confirmed | 00:01:50 | Success | 0 |

## 3. SUS score

| SUS ratings (10 items, 1-5 in statement order) | SUS score | Calculation |
|-----------------------------------------------|-----------|-------------|
| 4, 2, 5, 1, 4, 2, 5, 1, 4, 2 | 85 | (4-1)+(5-2)+(5-1)+(5-1)+(4-1)+(5-2)+(5-1)+(5-1)+(4-1)+(5-2)=34; 34 × 2.5 = 85 |

## 4. Usability issues

| ID | Task | Issue and evidence | Heuristic | Severity | Recommendation |
|----|------|-------------------|-----------|----------|----------------|
| U1 | T2 | Participant paused on the upload area and asked where the screenshot should be added; no help was given. This was the longest task and caused hesitation before submission. | Recognition rather than recall | 2 | Make the upload area more prominent and add a short helper line: “Upload your payment screenshot here.” |
| U2 | T2 | Participant asked what the transaction number format should be and hesitated before entering it; no help was given. | Error prevention | 2 | Show the exact format beside the field, e.g. `123-456789012`, and keep it visible while typing. |
| U3 | T2/T4 | After submitting the payment, the outcome was visible but the next step was not obvious; the participant had to look for the receipt/payment-history access. | Visibility of system status | 2 | Keep the confirmation card and receipt link clearly visible immediately after payment. |
| U4 | T3 | Participant looked for the download action and asked, “Where is the Download button?” before the statement was found. | Recognition rather than recall | 2 | Place the statement download button in a consistent, prominent location on the results page. |
| U5 | Activity 4 | A registered module cannot be unregistered. The Register Modules page shows registered modules but provides no way to undo a registration. | User control and freedom | 3 | Add an Unregister action with a confirmation prompt. |
| U6 | T1/T2 | The participant said the most difficult part was the payment step because there were multiple fields and all of them looked similar to a normal upload form. | Minimalist design / consistency | 2 | Group the payment fields into one clear form and reduce visual clutter around the upload area. |

## 5. Top three recommendations

1. Make the upload area and transaction-number hint more obvious at the payment step so the user knows exactly what to do next.
2. Keep the confirmation and receipt access visible immediately after payment is submitted.
3. Add a clear cancel/back option in Register Modules and make the download action more prominent on the results page.

## 6. Closing questions and participant comments

- What was the most difficult part? The tuition payment step was the hardest because the participant was not sure where to attach the screenshot and what format the transaction number should be.
- What would you change? The upload area should be more obvious, the expected transaction format should be shown directly beside the field, and the statement download button should be easier to spot on the results page.

## 7. Before and after screenshot note

Before improvement: Register Modules page showing a registered module with no way to undo the registration.

After improvement: Register Modules page shows an Unregister action for each registered module. Selecting it displays a confirmation prompt before the registration is removed.

Activity 4 repeat: The participant repeated the registration task after the change. The participant successfully selected Unregister, confirmed the prompt, and saw the module removed from the registered-modules list. Result: Success; errors: 0; help given: none.

## 8. Reflection

This test revealed issues that purely functional testing would not show: discoverability of the upload field, clarity of the transaction format, and the need for obvious recovery actions. The partner completed all tasks successfully, but the experience was hindered by uncertainty at the payment and results steps. The SUS score of 85 indicates generally positive usability, but the comments still support improvements to the payment and results flows. A real student or staff member may experience the system differently depending on their device, how often they log in, and how familiar they are with mobile banking. A user on a small phone may find the upload and download controls harder to notice, while a frequent user may complete the tasks faster than a first-time user.
