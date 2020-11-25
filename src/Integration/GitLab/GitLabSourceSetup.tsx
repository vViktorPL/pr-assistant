import { Input, Form, Select } from 'antd';

export const GitLabSourceSetup = () => {
  return (
    <>
      <Form.Item
        label="Repository path"
        name="repositoryPath"
        rules={[{ required: true, message: 'Please input repository path.' }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Filter labels"
        name="filterLabels"
      >
        <Select mode="tags" style={{ width: '100%' }} placeholder="Enter PR labels..." />
      </Form.Item>
    </>
  );
}
