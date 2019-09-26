# Sample CI/CD Code

Mile Two’s DevOps services are designed to help drive improvements in software delivery, operations and compliance.  They are made up of a combination of people, platform and services. In this article we want to share with you in some detalil how that is accomplish. This repo contains sample code that illistrates how we approach DevSecOps. Documents and drawings are good but with Kubernetes and its declarative yaml files it is easier to just show you the code. There are a million CI/CD pipeline drawings out there and most of them leave you wondering, "how are they doing that?" We feel there is nothing like using concret coding examples to illistrate your approach and that is what we intend to do in this repo.


> TODO - this is not a good transistion, I am not sure how this document should be structured but I am just going with it for now to illistrate how to link to examples...

We have code examples of each of the above in this repo, let't take a look. 

```bash
cicd-sample             <- This repo
 ├── sample-app         <- Sample application code, would be its own repo
 └── sample-environment <- Sample environment config, would be its own repo
```

The [sample-app folder](sample-app) contains a sample application. In this case it is a simple web UI.  The applicaiton is contained here in a subfolder for illistration purposes but real applications would be contained in its own source code repo.  We favor single purpose repos not monolithic/multipurpose repos. In other words we favor the micro service approach.

The [sample-environment folder](sample-environment) contains the CaC and IaC needed to declaritivly define the environment. It too would be contained in its own source repo and is only a subfolder here for illistration purposes. An environment repo is a [Helm chart](sample-environment/env/Chart.yaml) that has every application and service for the envrionment explicitly listed along with its version number in the the [requirements.yaml](sample-environment/env/requirements.yaml) file.  There is one enviroment repo for each environment such as; development, integration, test, pre-production, and production.  

## GitOps

We use Git as a single source of truth for declarative infrastructure and applications. All deployments start with a Pull Request. For example, to deploy a new version of `sample-app` into the `sample-environment`, one would update [the version line](sample-environment/env/requirements.yaml#L15) or `sample-app` in the [requirements.yaml](sample-environment/env/requirements.yaml) file.  The code snipit below illistrates the change.


```yaml
...
// current
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.55
...

// include this change in a PR
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.56           <- change this line
```

Although this can be done manully, most of the time the change is preformed automaticly. Once an applicaton build is successful the CI/CD piepeline will open a Pull Request against the intergaton environment to have the new version of the applicaiton deployed. For the intergration environments the Pull Requests are accepted automaticly however for production environments the Pull Requests can only be accepted by certain indviduals.  This provides a good level of audit and controles on canges.  

> TODO add a link to the spot in the jenkins file that does the PR


