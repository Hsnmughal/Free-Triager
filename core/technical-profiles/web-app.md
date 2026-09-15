# Technical Profile: Web or App

Apply when `target_classification.required_profiles` includes `web_app`. Support `source_assisted`, `black_box`, and `hybrid` evidence without assuming a particular frontend, backend, API, or mobile stack.

Validate the decisive path across:

- exact authorized test target, environment, version, account roles, and asset ownership;
- request/action sequence, inputs, responses, state changes, and reproducibility;
- authentication, authorization, session, identity, tenant, and privilege boundaries when relevant;
- browser, mobile, API, backend, storage, upload, rendering, or integration behavior implicated by evidence;
- required victim interaction, attacker prerequisites, rate/traffic constraints, and realistic end effect;
- sensitive-data classification, persistence, scope, and affected users or funds;
- PoC form and end effect required by the program.

Never test production destructively, access unrelated user data, exceed authorized traffic, or infer vulnerability from scanner output alone. For black-box reports, validate from permitted request/response evidence and reproducible behavior rather than demanding source code.
