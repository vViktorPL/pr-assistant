import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout, Menu, Button } from 'antd';
import { GitLabIntegration } from './Integration/GitLab/GitLabIntegration'
import { Integration, Repository } from './Integration/Integration'
import { PullRequestTable } from './PullRequestTable'
import {
  RepositorySetupForm,
  RepositorySetupFormProps
} from './RepositorySetupForm'

import 'antd/dist/antd.css';
import './App.css';

const { Header, Content, Sider } = Layout;

const integrations: Integration<any>[] = [
  new GitLabIntegration(),
];

function App() {

  const repositoriesInitialState = useMemo(
    () => JSON.parse(localStorage.getItem("repositories") || "[]"),
    []
  );
  const [repositories, setRepositories] = useState<Repository<unknown>[]>(repositoriesInitialState);
  const [selectedRepositoryIndex, setSelectedRepositoryIndex] = useState<number|undefined>(repositories.length > 0 ? 0 : undefined);
  const [loading, setLoading] = useState(false);

  const routeCatched = integrations.some(
    integration => {
      if (integration.extraRoutes) {
        const pathMatch = Object.entries(integration.extraRoutes).find(([path]) => document.location.pathname === path);

        if (pathMatch) {
          pathMatch[1]();
          return true;
        }
      }

      return false;
    }
  );

  const refresh = useCallback(
    () => {
      if (selectedRepositoryIndex === undefined) {
        return;
      }

      setLoading(true);

      const integration: Integration<unknown> = integrations.find(({ id }) => id === repositories[selectedRepositoryIndex].integrationId)!;

      integration.fetchPullRequests(repositories[selectedRepositoryIndex].source).then(fetchedPRs => {
        fetchedPRs.sort(
          (a, b) => {
            const statusComp = a.status - b.status;

            if (statusComp === 0) {
              return +a.createdAt - +b.createdAt;
            } else {
              return statusComp;
            }
          }
        );

        setRepositories((repositories) => repositories.map(
          (repository, index) => index === selectedRepositoryIndex ?
            { ...repository, data: fetchedPRs } :
            repository
        ));
        setLoading(false);
      })
    },
    [repositories, selectedRepositoryIndex]
  );

  useEffect(
    () => {
      if (!routeCatched && selectedRepositoryIndex !== undefined && repositories[selectedRepositoryIndex].data === undefined && loading === false) {
        refresh();
      }
    },
    [routeCatched, selectedRepositoryIndex, repositories, loading, refresh]
  );

  const repositoryMenuItems = useMemo(
    () =>
      repositories.map(
        ({ name }, index) => (
          <Menu.Item key={index} onClick={() => setSelectedRepositoryIndex(index)}>{name}</Menu.Item>
        )
      ),
    [repositories]
  );

  const onRepositorySetup = useCallback(
    () => {
      setSelectedRepositoryIndex(undefined);
    },
    []
  );

  const onRepositorySave = useCallback<RepositorySetupFormProps['onSave']>(
    repository => {
      setRepositories(prevRepositories => [...prevRepositories, repository]);
      setSelectedRepositoryIndex(repositories.length);

      localStorage.setItem("repositories", JSON.stringify([...repositories, repository].map(({ data, ...config }) => config)));
    },
    [repositories]
  );

  return (
    <Layout>
      <Header className="header">
        <div className="logo">
          <h1>PR assistant</h1>
        </div>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
          <Sider className="site-layout-background" width={250}>
            <Menu
              mode="inline"
              defaultSelectedKeys={[selectedRepositoryIndex !== undefined ? String(selectedRepositoryIndex) : 'add']}
              selectedKeys={[selectedRepositoryIndex !== undefined ? String(selectedRepositoryIndex) : 'add']}
              style={{ height: '100%' }}
            >
              {repositoryMenuItems}
              <Menu.Item key="add" onClick={onRepositorySetup}>+ Add new repository</Menu.Item>
            </Menu>
          </Sider>
          <Content style={{ padding: '0 24px', minHeight: 280 }}>
            {selectedRepositoryIndex === undefined
              ? <RepositorySetupForm availableIntegrations={integrations} onSave={onRepositorySave} />
              : (
                <>
                  <div>
                    <Button onClick={refresh} disabled={loading}>Refresh</Button>
                  </div>
                  <PullRequestTable loading={loading} pullRequests={repositories[selectedRepositoryIndex].data || []} />
                </>
              )
            }
          </Content>
        </Layout>
      </Content>
    </Layout>
  );
}

export default App;
