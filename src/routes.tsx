import WorkloadListPage from './pages/WorkloadList/WorkloadListPage';
import ServiceListPage from './pages/ServiceList/ServiceListPage';
import IstioConfigPage from './pages/IstioConfigList/IstioConfigListPage';
import ServiceJaegerPage from './pages/ServiceJaeger/ServiceJaegerPage';
import IstioConfigDetailsPage from './pages/IstioConfigDetails/IstioConfigDetailsPage';
import WorkloadDetailsPage from './pages/WorkloadDetails/WorkloadDetailsPage';
import AppListPage from './pages/AppList/AppListPage';
import AppDetailsPage from './pages/AppDetails/AppDetailsPage';
import OverviewPageContainer from './pages/Overview/OverviewPage';
import InfrastructurePageContainer from './pages/Infrastructure/InfrastructurePage';
import DashboardPageContainer from './pages/Dashboard/DashboardPage';

import NodesDetailContainer from './pages/Dashboard/NodeDetail';
import NamespaceDetailContainer from './pages/Dashboard/NamespaceDetail';
import DaemonsetDetailContainer from './pages/Dashboard/DaemonsetDetail';
import DeploymentDetailContainer from './pages/Dashboard/DeployDetail';
import ReplicasetDetailContainer from './pages/Dashboard/ReplicasetDetail';
import PodDetailContainer from './pages/Dashboard/PodDetail';

import { MenuItem, Path, GroupId } from './types/Routes';
import GraphPageContainer from './pages/Graph/GraphPage';
import { icons, Paths } from './config';
import ServiceDetailsPageContainer from './pages/ServiceDetails/ServiceDetailsPage';
import DefaultSecondaryMasthead from './components/DefaultSecondaryMasthead/DefaultSecondaryMasthead';

/**
 * Return array of objects that describe vertical menu
 * @return {array}
 */
const navItems: MenuItem[] = [
  {
    iconClass: icons.menu.dashboard,
    title: 'Infrastructure',
    to: '/' + Paths.INFRASTRUCTURE + '/overview',
    pathsActive: [/^\/infrastructure\/(.*)/],
    groupId: GroupId.INFRASTRUCTURE
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Kubernetes',
    to: '/' + Paths.KUBERNETES + '/overview',
    pathsActive: [new RegExp('^/' + Paths.KUBERNETES + '/(.*)')],
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.network,
    title: 'Network',
    to: '/network',
    pathsActive: [/^\/network\/(.*)/]
  },
  {
    iconClass: icons.menu.graph,
    title: 'Graph',
    to: '/graph/namespaces/',
    pathsActive: [/^\/graph\/(.*)/]
  },
  {
    iconClass: icons.menu.applications,
    title: 'Applications',
    to: '/' + Paths.APPLICATIONS,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.APPLICATIONS + '/(.*)')]
  },
  {
    iconClass: icons.menu.workloads,
    title: 'Workloads',
    to: '/' + Paths.WORKLOADS,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.WORKLOADS + '/(.*)')]
  },
  {
    iconClass: icons.menu.services,
    title: 'Services',
    to: '/' + Paths.SERVICES,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.SERVICES + '/(.*)')]
  },
  {
    iconClass: icons.menu.istioConfig,
    title: 'Istio Config',
    to: '/' + Paths.ISTIO,
    pathsActive: [new RegExp('^/namespaces/(.*)/' + Paths.ISTIO + '/(.*)')]
  },
  {
    iconClass: icons.menu.distributedTracing,
    title: 'Distributed Tracing',
    to: '/jaeger'
  }
];

const subItems: MenuItem[] = [
  {
    iconClass: icons.menu.dashboard,
    title: 'Overview',
    to: '/' + Paths.INFRASTRUCTURE + '/overview',
    groupId: GroupId.INFRASTRUCTURE
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Overview',
    to: '/' + Paths.KUBERNETES + '/overview',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Nodes',
    to: '/' + Paths.KUBERNETES + '/nodes',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Namespace',
    to: '/' + Paths.KUBERNETES + '/namespaces',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Daemonset',
    to: '/' + Paths.KUBERNETES + '/daemonsets',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Deployment',
    to: '/' + Paths.KUBERNETES + '/deployments',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Replicaset',
    to: '/' + Paths.KUBERNETES + '/replicasets',
    groupId: GroupId.KUBERNETES
  },
  {
    iconClass: icons.menu.dashboard,
    title: 'Pod',
    to: '/' + Paths.KUBERNETES + '/pods',
    groupId: GroupId.KUBERNETES
  },
];

const defaultRoute = '/infrastructure/overview';

const pathRoutes: Path[] = [
  {
    path: '/' + Paths.INFRASTRUCTURE,
    component: InfrastructurePageContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/nodes',
    component: NodesDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/namespaces',
    component: NamespaceDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/daemonsets',
    component: DaemonsetDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/deployments',
    component: DeploymentDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/replicasets',
    component: ReplicasetDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES + '/pods',
    component: PodDetailContainer
  },
  {
    path: '/' + Paths.KUBERNETES,
    component: DashboardPageContainer
  },
  {
    path: '/network',
    component: OverviewPageContainer
  },
  {
    path: '/graph/node/namespaces/:namespace/' + Paths.APPLICATIONS + '/:app/versions/:version',
    component: GraphPageContainer
  },
  {
    path: '/graph/node/namespaces/:namespace/' + Paths.APPLICATIONS + '/:app',
    component: GraphPageContainer
  },
  {
    path: '/graph/node/namespaces/:namespace/' + Paths.SERVICES + '/:service',
    component: GraphPageContainer
  },
  {
    path: '/graph/node/namespaces/:namespace/' + Paths.WORKLOADS + '/:workload',
    component: GraphPageContainer
  },
  {
    path: '/graph/namespaces',
    component: GraphPageContainer
  },
  {
    path: '/namespaces/:namespace/' + Paths.SERVICES + '/:service',
    component: ServiceDetailsPageContainer
  },
  // NOTE that order on routes is important
  {
    path: '/namespaces/:namespace/' + Paths.ISTIO + '/:objectType/:objectSubtype/:object',
    component: IstioConfigDetailsPage
  },
  {
    path: '/namespaces/:namespace/' + Paths.ISTIO + '/:objectType/:object',
    component: IstioConfigDetailsPage
  },
  {
    path: '/' + Paths.SERVICES,
    component: ServiceListPage
  },
  {
    path: '/' + Paths.APPLICATIONS,
    component: AppListPage
  },
  {
    path: '/namespaces/:namespace/' + Paths.APPLICATIONS + '/:app',
    component: AppDetailsPage
  },
  {
    path: '/' + Paths.WORKLOADS,
    component: WorkloadListPage
  },
  {
    path: '/namespaces/:namespace/' + Paths.WORKLOADS + '/:workload',
    component: WorkloadDetailsPage
  },
  {
    path: '/' + Paths.ISTIO,
    component: IstioConfigPage
  },
  {
    path: '/' + Paths.JAEGER,
    component: ServiceJaegerPage
  }
];

const secondaryMastheadRoutes: Path[] = [
  {
    path: '/graph/namespaces',
    component: DefaultSecondaryMasthead
  },
  {
    path: '/' + Paths.APPLICATIONS,
    component: DefaultSecondaryMasthead
  },
  {
    path: '/' + Paths.SERVICES,
    component: DefaultSecondaryMasthead
  },
  {
    path: '/' + Paths.WORKLOADS,
    component: DefaultSecondaryMasthead
  },
  {
    path: '/' + Paths.ISTIO,
    component: DefaultSecondaryMasthead
  },
  {
    path: '/' + Paths.JAEGER,
    component: DefaultSecondaryMasthead
  }
];

export { defaultRoute, navItems, subItems, pathRoutes, secondaryMastheadRoutes };
