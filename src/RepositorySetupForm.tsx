import * as React from 'react';
import { Form, Input, Button, Checkbox, Select } from 'antd';
import { Integration, Repository } from './Integration/Integration'
import { useCallback, useState } from 'react'

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};
const tailLayout = {
  wrapperCol: { offset: 8, span: 16 },
};

export type RepositorySetupFormProps = {
  availableIntegrations: Integration<unknown>[];
  onSave: (repository: Repository<unknown>) => void;
}

export const RepositorySetupForm = ({ availableIntegrations, onSave }: RepositorySetupFormProps) => {
  const [form] = Form.useForm();
  const [selectedIntegrationId, setSelectedIntegrationId] = useState<string|undefined>();

  console.log(form.getFieldsValue());

  const onFinish = useCallback(
    (formValues) => {
      const { name, integrationId, ...source } = formValues;

      onSave({ name, integrationId, source });
    },
    [onSave]
  );
  const onPlatformSelect = useCallback(
    (value) => setSelectedIntegrationId(value),
    []
  );
  const onPlatformClear = useCallback(
    () => setSelectedIntegrationId(undefined),
    []
  );

  return (
    <Form
      {...layout}
      name="basic"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      form={form}
      // onFinishFailed={onFinishFailed}
    >
      <Form.Item
        label="Name"
        name="name"
        rules={[{ required: true, message: 'Please provide any custom name which you would like to use to identify your repository' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="integrationId" label="Platform" rules={[{ required: true, message: 'Select platform on which your repository is hosted' }]}>
        <Select
          placeholder="Select platform"
          onSelect={onPlatformSelect}
          onClear={onPlatformClear}
          allowClear
        >
          {availableIntegrations.map(
            ({ id, name }) => (
              <Select.Option value={id}>{name}</Select.Option>
            )
          )}
        </Select>
      </Form.Item>

      {selectedIntegrationId !== undefined && (
        React.createElement(availableIntegrations.find(({ id }) => selectedIntegrationId)!.sourceSetupComponent)
      )}

      <Form.Item {...tailLayout}>
        <Button type="primary" htmlType="submit">
          Save
        </Button>
      </Form.Item>
    </Form>
  );

}
