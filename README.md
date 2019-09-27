# Sample CI/CD Code

Mile Two’s DevSecOps services are designed to help drive improvements in software delivery, operations and compliance. In this article we want to share with you, in some detalil, how this is accomplished by pointing at several coding samples that illistrates our approach to certain DevSecOps capabiities.

This repo is structured as follows:

```bash
cicd-sample             <- This repo
 ├── sample-app         <- Sample application code, would be its own repo
 └── sample-environment <- Sample environment config, would be its own repo
```

* **cicd-sample** - This source repo
* **sample-app** - The [sample-app folder](sample-app) contains a sample application. In this case it is a simple web UI.  The applicaiton is contained here in a subfolder for illistration purposes but real applications would be contained in its own source code repo.  We favor single purpose repos not monolithic/multipurpose repos. In other words we favor the micro service approach.
* **sample-environment** - The [sample-environment folder](sample-environment) contains the CaC and IaC needed to declaritivly define the environment. It too would be contained in its own source repo and is only a subfolder here for illistration purposes. An environment repo is a [Helm chart](sample-environment/env/Chart.yaml) that has every application and service for the envrionment explicitly listed along with its version number in the the [requirements.yaml](sample-environment/env/requirements.yaml) file.  There is one enviroment repo for each environment such as; development, integration, test, pre-production, and production.  

## GitOps

We use Git as the single source of truth for declarative infrastructure and applications. All deployments start with a Pull Request. For example, to deploy a new version of the *sample-app* into the *sample-environment*, one would update [the version](sample-environment/env/requirements.yaml#L15) of `sample-app` in the [requirements.yaml](sample-environment/env/requirements.yaml) file.  The code snipit below illistrates the change.


```yaml
...
// before PR
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.55
...

// after PR
- name: sample-app
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.56           <- changed this line
...
```

Although the envrionment repo can be modified manully to deploy new versions of the application, most of the time the change is preformed automaticly via the CI pipeline. Once an applicaton build is successful the [jx step post build](sample-environment/Jenkinsfile#L95) command will open a Pull Request against the environment repo.  For the intergration environments the Pull Requests are accepted automaticly and this initiates a [CD pipeline](sample-environment/Jenkinsfile) which will perform the actual deployment of the application into the environment. For production environments the Pull Requests are not automaticaly accepted rather they can only be accepted by certain indviduals, thereby serving as an audit and control function. 


## Application Pipeline

