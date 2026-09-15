# Worker: Report Revision

Run only after a completed verdict and an explicit user request to revise the report.

For Immunefi, use the report-template and PoC-guideline references routed from the entrypoint before revising.

Inputs:

- original report from the session input directory;
- completed verdict and improvement checkpoint;
- applicable public and user-supplied private submission guidance;
- destination path approved or implied by the user's request.

Preserve the original report. Unless the user explicitly requests overwrite, write `<original-name>.free-triager-revised.<ext>` beside the user's chosen output location or inside the session directory.

Apply only evidence-supported changes:

- correct inaccurate code or scope claims;
- narrow unsupported impact or severity language;
- add missing preconditions, exploit steps, citations, and PoC instructions;
- improve title, structure, reproducibility, and submission-field fit;
- keep private guidance out of the report unless it is appropriate to include.

Make the report complete and naturally specific to the researched code. Do not add wording whose purpose is to disguise AI assistance, manipulate an automated classifier, or evade platform automation checks. The researcher must review and verify the revised report before submission.

Do not invent evidence, execute a new exploit, conceal a failed gate, or convert `needs_information` into certainty.

Required `result` keys: `original_path`, `revised_path`, `change_log`, and `remaining_risks`.
