# Security policy — EducaTech / Startup XYZ

## Non-negotiable credential rules

- Never commit AWS access keys, secret keys, session tokens, passwords, private keys, OAuth client secrets, GitHub tokens, or other live credentials.
- Never put credentials in Markdown files, YAML templates, source code, logs, screenshots, issue descriptions, or commit messages.
- Never commit local `.env` files, AWS credential profiles, or Python virtual environments (`.venv/`, `venv/`, `env/`).
- Do not use real credentials in examples. If an example file is needed, use variable names with clearly fake placeholder values only.
- Do not embed AWS credentials in CloudFormation parameters, Lambda environment variables committed to Git, or GitHub workflow files.
- Prefer GitHub OIDC federation and short-lived AWS role sessions for CI/CD.
- Use AWS Secrets Manager or Systems Manager Parameter Store for application secrets when appropriate; use GitHub Actions secrets only for values that cannot be replaced by OIDC.
- Keep IAM permissions scoped to the required repository, branch, environment, actions, and AWS resources.

## If a credential is exposed

1. Revoke or rotate it immediately; deleting the file alone is not sufficient.
2. Check CloudTrail and relevant provider audit logs for suspicious use.
3. Remove the secret from the current files and address Git history exposure with a coordinated history rewrite if required.
4. Review forks, caches, artifacts, logs, pull requests, and other copies.
5. Re-run secret scanning and record remediation without copying the secret into the incident report.

## Validation

Pull requests and pushes should run the repository's secret-scanning workflow. A clean scan is useful evidence, but it does not prove that no secret exists. Review findings before merging.
