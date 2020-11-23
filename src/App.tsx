import 'antd/dist/antd.css';
import './App.css';

import { Layout, Menu, Breadcrumb } from 'antd';
import { UserOutlined, LaptopOutlined, NotificationOutlined } from '@ant-design/icons';

import { GitLabIntegration } from './Integration/GitLab/GitLabIntegration'
import { Integration, PullRequest } from './Integration/Integration'
import { useEffect, useState } from 'react'
import { PullRequestTable } from './PullRequestTable'

const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;


const integrations: Integration<any>[] = [
  new GitLabIntegration(),
];

function App() {

  const routeCatched = integrations.some(
    integration => {
      if (integration.extraRoutes) {
        const pathMatch = Object.entries(integration.extraRoutes).find(([path]) => document.location.pathname === path);

        if (pathMatch) {
          pathMatch[1]();
          return true;
        }
      }
    }
  );
  const [pullRequests, setPullRequests] = useState<PullRequest[]|undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(
    () => {
      if (!routeCatched && pullRequests === undefined) {
        setLoading(true);
        integrations[0].fetchPullRequests({
          repositoryPath: _PROJECT_PATH_,
          filterLabels: [],
        }).then(fetchedPRs => {
          setPullRequests(fetchedPRs.sort(
            (a, b) => {
              const statusComp = a.status - b.status;

              if (statusComp === 0) {
                return +a.createdAt - +b.createdAt;
              } else {
                return statusComp;
              }
            }
          ));
          setLoading(false);
        })
      }
    },
    [routeCatched, pullRequests]
  );


  return (
    <Layout>
      <Header className="header">
        <div className="logo" />
        <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['2']}>
          <Menu.Item key="1">nav 1</Menu.Item>
          <Menu.Item key="2">nav 2</Menu.Item>
          <Menu.Item key="3">nav 3</Menu.Item>
        </Menu>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Breadcrumb style={{ margin: '16px 0' }}>
          <Breadcrumb.Item>Home</Breadcrumb.Item>
          <Breadcrumb.Item>List</Breadcrumb.Item>
          <Breadcrumb.Item>App</Breadcrumb.Item>
        </Breadcrumb>
        <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
          <Sider className="site-layout-background" width={200}>
            <Menu
              mode="inline"
              defaultSelectedKeys={['1']}
              defaultOpenKeys={['sub1']}
              style={{ height: '100%' }}
            >
              <SubMenu key="sub1" icon={<UserOutlined />} title="subnav 1">
                <Menu.Item key="1">option1</Menu.Item>
                <Menu.Item key="2">option2</Menu.Item>
                <Menu.Item key="3">option3</Menu.Item>
                <Menu.Item key="4">option4</Menu.Item>
              </SubMenu>
              <SubMenu key="sub2" icon={<LaptopOutlined />} title="subnav 2">
                <Menu.Item key="5">option5</Menu.Item>
                <Menu.Item key="6">option6</Menu.Item>
                <Menu.Item key="7">option7</Menu.Item>
                <Menu.Item key="8">option8</Menu.Item>
              </SubMenu>
              <SubMenu key="sub3" icon={<NotificationOutlined />} title="subnav 3">
                <Menu.Item key="9">option9</Menu.Item>
                <Menu.Item key="10">option10</Menu.Item>
                <Menu.Item key="11">option11</Menu.Item>
                <Menu.Item key="12">option12</Menu.Item>
              </SubMenu>
            </Menu>
          </Sider>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            <PullRequestTable loading={loading} pullRequests={pullRequests || []} />
          </Content>
        </Layout>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
    </Layout>
  );
}

export default App;
