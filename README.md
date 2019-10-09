# Sample CI/CD Code

Mile Two’s DevSecOps services are designed to help drive improvements in software delivery, operations and compliance. In this article we want to share with you, in some detalil, how this is accomplished by pointing at several coding samples that illistrates our approach to certain DevSecOps capabiities.

This repo is structured as follows:

```bash
cicd-sample             <- This repo
 ├── sample-app         <- Sample application code
 └── sample-environment <- Sample environment config
```

* **cicd-sample** - This source repo
* **sample-app** - The [sample-app folder](sample-app) contains a sample application. In this case the application is a simple web UI but could be an API or some other micro service.  The application is contained here in a subfolder for illustration purposes but real applications would be contained in its own source code repo.  We favor single purpose repos not monolithic/multipurpose repos. In other words, we favor the micro service approach.
* **sample-environment** - The [sample-environment folder](sample-environment) contains all the configuration resources needed to declaratively define the environment. This is often referred to as Configuration-as-Code (CaC) and Infrastructure-as-Code (IaC). It too would be contained in its own source repo and is only a subfolder here for illustration purposes. An environment repo is a [Helm chart](sample-environment/env/Chart.yaml) that has every application and service for the environment explicitly listed along with its version number in the  [requirements.yaml](sample-environment/env/requirements.yaml) file.  There is one environment repo for each target environment such as; development, integration, test, pre-production, and production.  

## GitOps

We use Git as the single source of truth for declarative infrastructure and applications. All deployments start with a Pull Request. For example, to deploy a new version of the *sample-app* into the *sample-environment*, one would update [the version sample-app](sample-environment/env/requirements.yaml#L15) of in the [requirements.yaml](sample-environment/env/requirements.yaml) file.  The code snippet below illustrates the change.


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

Although the environment repo can be modified manually to deploy new versions of the application, most of the time the change is preformed automatically via the CI pipeline. Once an application build is successful the [jx step post build](sample-environment/Jenkinsfile#L95) command will open a Pull Request against the environment repo.  For the integration environments the Pull Requests are accepted automatically and this initiates a [CD pipeline](sample-environment/Jenkinsfile) which will perform the actual deployment of the application into the environment. For production environments the Pull Requests are not automatically accepted rather they can only be accepted by certain individuals, thereby serving as an audit and control function.

## CI/CD Pipelines

Each project contains a *Jenkinsfile* used to declaratively describe the pipeline:

* The *Jenkinsfile* in the application repo defines a [CI pipeline](sample-app/Jenkinsfile) 
* The *Jenkinsfile* in the environment repo defines a [CD pipeline](sample-environment/Jenkinsfile).

## Charts

### Environment Charts

Each environment repo contains a helm chart that is used to describe its Kubernetes deployment. All the configuration, environment specific application values and a list of applications are described in this repo in the [env chart](sample-environment/env) with the following structure:

```text
env/
├── Chart.yaml
├── requirements.yaml  <-- A list of applications sub-charts in this environment
├── templates
└── values.yaml        <-- Environment specific values for this environment
```

* `Chart.yaml` - contains the name and version of this chart
* `requirements.yaml` - contains the list of applications sub-charts deployed in this environment. For example, the following yaml snippet shows the inclusion of `samle-app` into this environment:

    ```yaml
    - name: sample-app
      repository: http://jenkins-x-chartmuseum:8080
      version: 0.1.55
    ```

* `templates` - Kubernetes manifest files unique to this environment. For example, environment specific config maps might be included here.
* `values.yaml` - contains all the property override valeus for this environment. For example, when the [CD pipeline](sample-environment/Jenkinsfile) runs, the [env chart](sample-environment/env) is applied using `helm install`.  This will use the following values for the *sample-api* deployment. In this cae we see the environment specific values for `DB_HOST`, `REDIS_SERVER` and so on:  

    ```yaml
    sample-api:
      env:
        ENV: 'staging'
        DB_HOST: 'mongodb'
        DB_PORT: '27017'
        DB_DATABASE: 'sampledb'
        REDIS_SERVER: 'redis://staging-redis-master:6379'  
        REDIS_CHANNEL: 'socket.io'
    ```

### Application Charts

Each application has a [chart folder](sample-app/charts) with two helm charts, one for the application and the second for its preview environment. 

```text
charts
├── preview
│   ├── Chart.yaml
│   ├── Makefile
│   ├── requirements.yaml
│   ├── templates
│   └── values.yaml
└── sample-app
    ├── Chart.yaml
    ├── Makefile
    ├── README.md
    ├── templates
    └── values.yaml
```

#### preview chart

Each chart, because it is a Helm chart, has a similar layout, however notice how the [preview chart](sample-app/charts/preview) contains a *requirements.yaml* file. The *preview chart* is really an on-demand environment chart and the [requirements.yaml](sample-app/charts/preview/requirements.yaml) is used to list all of the application's dependencies such as an API and database needed to preview the application.  This allows the team to preview a fully functional application before merging to master. This is particularly useful with UI changes. Also, the pipeline is able to run automated end-to-end tests in a "disposable" preview environment. The following yaml snippet from the [requirements.yaml](sample-app/charts/preview/requirements.yaml) shows how the API, database and redis are deployed each time a preview environment is created.

```yaml
- name: sample-api
  repository: http://jenkins-x-chartmuseum:8080
  version: 0.1.33
- name: mongodb
  repository: https://kubernetes-charts.storage.googleapis.com
  version: 7.0.2
- name: redis
  repository: https://kubernetes-charts.storage.googleapis.com
  version: 6.4.5
```

#### application chart

The application chart, unlike an environment chart, is used to describe a single application.  The [templates](sample-app/charts/sample-app/templates) folder contains the Kubernetes manifest files needed to run the application. In this case we have a [deployment.yaml](sample-app/charts/sample-app/templates/deployment.yaml) and a [service.yaml](sample-app/charts/sample-app/templates/service.yaml) manifest files. Notice how these manifest files are not hardcoded.  All of the property values that can change between environments are templated.  A template directive is enclosed in `{{` and `}}` blocks. In this way the same chart can be used to deploy the application to different environments without rebuilding the application. The property values in the [application’s values.yaml](sample-app/charts/sample-app/values.yaml) contain the application defaults.  These values may be overridden when the application is deployed with the values stored in the [environment's values.yaml](sample-environment/env/values.yaml) file.  

## Tests

### unit tests

### end-to-end tests

