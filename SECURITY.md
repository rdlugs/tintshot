# Security Policy

## Supported versions

Tintshot is a client-side application with no server component. Only the latest
code on the default branch, and the deployment built from it, receive security
fixes.

## Privacy model

Tintshot processes images entirely in the browser. Screenshots are read into a
canvas, rendered, and exported locally. The application does not upload image
data, does not require an account, and does not include analytics or tracking.

A vulnerability that causes image data to leave the browser, or that lets a
crafted image run code in the page, is treated as a high-severity issue.

## Reporting a vulnerability

Please do not open a public issue for a security problem.

Report it privately through GitHub's
[private vulnerability reporting](https://github.com/rdlugs/tintshot/security/advisories/new),
or by email to rojensonlugo@gmail.com.

Include:

- A description of the issue and its impact
- Steps to reproduce, and a sample input if one is needed
- The browser and operating system you observed it on

You can expect an acknowledgement within seven days. Once the issue is
confirmed, a fix will be prepared and released, and you will be credited in the
advisory unless you prefer otherwise.

Please do not include confidential or personally identifiable content in any
sample image attached to a report.
