# Personal Certificates Setup

This script sets up self-signed SSL certificates for local development environments. It allows you to run your Flask application over HTTPS using self-signed certificates.

## Prerequisites

- PowerShell
- OpenSSL installed and available in your system PATH

## Script Overview

The script will:

1. Create a directory for the certificates if it doesn't exist.
2. Generate self-signed SSL certificates for specified domains.
3. Create symbolic links to the generated certificate and key files.

## Domain Configuration

Edit the script to specify the domains for which you want to create certificates. Update the `$domains` variable as follows:

```powershell
$domains = @{
    "yourdomain1.local" = "C:\path\to\webroot1"
    "yourdomain2.local" = "C:\path\to\webroot2"
}
