# codebase-src (WIP)

## Description
Get the codebase of different javascript frameworks and expose them on the [codebase repository](https://github.com/ebourmalo/codebase). 
So we see the evolution and the differences through the different versions over time.

This project is organized in 4 independent modules:

- Update notifier
- Installer
- Publisher
- Cleaner

### The Update notifier module

Listens on a specific channel the frameworks to check.
Uses the Npm registry for getting the last stable version
Compares it with the last version published on the codebase repo. 
Notifies the **Installer** module if it's not yet published.

### The Installer module

Listens on a specific channel the frameworks (and versions) to install (locally).
Install them in the local environment.
Generates the codebase (can differs from framework to framework).
Notifies the **Publisher** module the codebase has been generated.

### The Publisher module 

Listen on a specific channel the frameworks to publish on the [codebase repository](https://github.com/ebourmalo/codebase).
Authenticate with a github account.
Push the generated codebase to the repo.
Notifies the **Cleaner** module the codebase has been published. 

### The Cleaner module

Listen on a specific channel the frameworks (and codebase) to clean.
Check if the framework is installed and if the directory exists.
Safely delete the codebase directory and uninstall the framework (npm module).
Notifies the **update** module the framework (and version) has been fully updated.

## Communication between modules

Initially developed with a micro-services oriented architecture, I use Redis and its Pub/Sub
feature to make my module speaking with each other. This way, there aren't coupled and are 
totally independent. If one crashes, it won't listen to the channel anymore but won't break the app.
For making this happen, I need to use internal package for each module to run them through different
processes.

## Requirements

- A redis server
- Node.js (>= 0.12.x)

## Todos

- Dev. of the installer and publisher modules
- Integrate Winston or bunyan for the logging
- Update the architecture of the modules as internal packages for a proper micro-service implementation.
- Integrate 0MQ for the communication between modules