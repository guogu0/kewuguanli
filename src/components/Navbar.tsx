import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      label: '数据上传',
    },
    {
      key: '/statistics',
      label: '课时统计',
    },
    {
      key: '/schedule',
      label: '课表查询',
    },
    {
      key: '/free-teachers',
      label: '空闲教师查询',
    },
  ];

  return (
    <Menu
      mode="horizontal"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
      style={{ marginBottom: '24px' }}
    />
  );
};

export default Navbar; 