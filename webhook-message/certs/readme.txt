
### README for Real Certificates Setup with Symbolic Links

```markdown
# Real Certificates Setup with Symbolic Links

This script sets up real SSL certificates for production environments using Certbot and symbolic links. It allows you to run your Flask application over HTTPS with valid certificates from Let's Encrypt.

## Prerequisites

- PowerShell
- Certbot installed and configured
- Access to your domain's DNS records

## Script Overview

The script will:

1. Check for existing certificates.
2. Request new certificates using Certbot for specified domains.
3. Create symbolic links to the obtained certificate and key files.

## Domain Configuration

Edit the script to specify the domains and their respective webroot paths. Update the `$domains` variable as follows:

```powershell
$domains = @{
    "blaster.ddns.net" = "C:\wamp64\www"
    "droid7.ddns.net" = "C:\wamp64\www\droid7\webhook-message\droid7"
    "mixitup-endpoint.ddns.net" = "C:\wamp64\www\mixitup-endpoint"
}
