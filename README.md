# Sample CI/CD Code

At Mile Two we have addopted a set of operational capabilities proven to drive improvements in software delivery and we want to share with you some of these capabilities. This repo contains sample code that illistrates how we approach DevSecOps. Documents and drawings are good but with Kubernetes and its declarative yaml manifest files it is easier to just show you the code. There are a million CI/CD pipeline drawings out there and most of them leave you wondering, "how are they doing that?" We feel there is nothing like using concret coding examples to illistrate your approach and that is what we intend to do in this repo.

In this repo you will find:

* sample CI and CD pipelines
* infastructure-as-code (IaC) and configuration-as-code (CaC) samples
* TODO add to this list
* and more...

## Continuous Delivery Foundations

We use the folloing best practices are used to implement continuous delivery:

* version control
* trunk-based development
* configuration management
* continuous integration
* test automation
* shift left on secutity
* automated deployment

Next let's take a look at some code sample in support of these best practices.

## Version Control

Use a version control system, such as GitHub, GitLab or Bitbucket for all production artifacts, such as:

* application code
* application configurations
* system configurations
* scripts for automating build and configuration of the environment

We have code examples of each of the above in this repo, let't take a look. 

```bash

cicd-sample             <- This repo
 ├── sample-app         <- Sample application code, would be its own repo
 └── sample-environment <- Sample environment config, would be its own repo
```

