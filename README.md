# Sample CI/CD Code

Mile Two’s DevSecOps services are designed to help drive improvements in software delivery, operations and compliance. In this article we want to share with you, in some detalil, how this is accomplished by pointing at several coding samples that illistrates our approach to certain DevSecOps capabiities.

This repo is structured as follows:

```bash
cicd-sample             <- This repo
 ├── sample-app         <- Sample application code
 └── sample-environment <- Sample environment config
```

* **cicd-sample** - This source repo
* **sample-app** - The [sample-app folder](sample-app) contains a sample application. In this case the applicatoin is a simple web UI but could be an API or some other micro service.  The applicaiton is contained here in a subfolder for illistration purposes but real applications would be contained in its own source code repo.  We favor single purpose repos not monolithic/multipurpose repos. In other words we favor the micro service approach.
* **sample-environment** - The [sample-environment folder](sample-environment) contains all the configuration resouces needed to declaritivly define the environment. This is often referred to as Configuation-as-Code (CaC) and Infrastructure-as-Code (IaC). It too would be contained in its own source repo and is only a subfolder here for illistration purposes. An environment repo is a [Helm chart](sample-environment/env/Chart.yaml) that has every application and service for the envrionment explicitly listed along with its version number in the the [requirements.yaml](sample-environment/env/requirements.yaml) file.  There is one enviroment repo for each target environment such as; development, integration, test, pre-production, and production.  

## GitOps

We use Git as the single source of truth for declarative infrastructure and applications. All deployments start with a Pull Request. For example, to deploy a new version of the *sample-app* into the *sample-environment*, one would update [the version sample-app](sample-environment/env/requirements.yaml#L15) of in the [requirements.yaml](sample-environment/env/requirements.yaml) file.  The code snipit below illistrates the change.


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

## CI/CD Pipelines

Each project contains a *Jenkinsfile* used to declaratively describe the pipeline:

* The *Jenkinsfile* in the application repo defines a [CI pipeline](sample-app/Jenkinsfile) 
* The *Jenkinsfile* in the environment repo defines a [CD pipeline](sample-environment/Jenkinsfile).

## Charts

### Environment Charts

Each environment repo containes a helm chart that isused to describe its kuberntetes deployment. All the configuration, envirionment specific application values and a list of applications are described in this repo in the [env chart](sample-environment/env) with the folloiwng structure:

```text
env/
├── Chart.yaml
├── requirements.yaml  <-- A list of applications sub-charts in this environment
├── templates
└── values.yaml        <-- Environment specific values for this environment
```

* `Chart.yaml` - contains the name and version of this chart
* `requirements.yaml` - contains the list of applications sub-charts deployed in this environment. For example, the following yaml snipit shows the inclustion of `samle-app` into this environment:

    ```yaml
    - name: sample-app
      repository: http://jenkins-x-chartmuseum:8080
      version: 0.1.55
    ```

* `templates` - Kubernetes manifest files unique to this environment. For example, environment specific config maps might be included here.
* `values.yaml` - contains all the property overide valeus for this environment. For example, when the [CD pipeline](sample-environment/Jenkinsfile) runs, the [env chart](sample-environment/env) is applied using `helm install`.  This will use the following values for the *sample-api* deployment. In this cae we see the environment specific valuse for `DB_HOST`, `REDIS_SERVER` and so on:  

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

Each chart, because it is a Helm chart, has a simular layout, however notice how the [preview chart](sample-app/charts/preview) contains a *requirements.yaml* file. The *preview chart* is really an on-demand environment chart and the [requirements.yaml](sample-app/charts/preview/requirements.yaml) is used to list all of the application's dependancies suchs as an API and database.  This will allows the developer to preview a fully functional application before merging to master. Also, the pipeline is able to run fully automatedend-to-end test in a "disposable" preview environment. The following yaml snipit from the [requirements.yaml](sample-app/charts/preview/requirements.yaml) shows how the API, databae and redis are installed each time a preview environment is created.

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


