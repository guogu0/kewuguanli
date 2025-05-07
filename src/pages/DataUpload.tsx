import React, { useState, useEffect } from 'react';
import { Button, message, Table, Upload, Modal, Form, Input, Select, TimePicker } from 'antd';
import { UploadOutlined, CheckOutlined, EditOutlined, SaveOutlined, CloseOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import type { UploadProps } from 'antd';
import type { ColumnType } from 'antd/es/table';
import type { Key } from 'react';
import dayjs from 'dayjs';

interface CourseData {
  startTime: string;
  endTime: string;
  week: number;
  grade: string;
  plannedTeacher: string;
  actualTeacher: string;
  reason: string;
  type: string;
  date: string;
  period: string;
  weekday: string;
  class: string;
  subject: string;
  session: number;
  courseType: string;
  hours: number;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  record: CourseData;
  index: number;
  children: React.ReactNode;
}

const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  record,
  index,
  children,
  ...restProps
}) => {
  const [form] = Form.useForm();
  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('courseData');
    if (data) {
      const parsedData = JSON.parse(data) as CourseData[];
      const types = Array.from(new Set(parsedData.map(item => item.courseType))).filter((type): type is string => typeof type === 'string');
      setCourseTypes(types);
    }
  }, []);

  const inputNode = (() => {
    if (dataIndex === 'startTime' || dataIndex === 'endTime') {
      return <TimePicker format="HH:mm" />;
    }
    if (dataIndex === 'hours') {
      return <Input type="number" />;
    }
    if (dataIndex === 'courseType') {
      return (
        <Select>
          {courseTypes.map(type => (
            <Select.Option key={type} value={type}>{type}</Select.Option>
          ))}
        </Select>
      );
    }
    return <Input />;
  })();

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            {
              required: true,
              message: `请输入${title}!`,
            },
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};

const DataUpload: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<CourseData[]>([]);
  const [isDataConfirmed, setIsDataConfirmed] = useState<boolean>(false);
  const [editingKey, setEditingKey] = useState<string>('');
  const [courseTypes, setCourseTypes] = useState<string[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('courseData');
    if (data) {
      const parsedData = JSON.parse(data) as CourseData[];
      const types = Array.from(new Set(parsedData.map(item => item.courseType))).filter((type): type is string => typeof type === 'string');
      setCourseTypes(types);
    }
  }, [data]);

  // 生成唯一的行 key
  const generateRowKey = (record: CourseData) => {
    const uniqueFields = [
      record.date,
      record.startTime,
      record.class,
      record.subject,
      record.actualTeacher,
      record.courseType
    ];
    return uniqueFields.join('-');
  };

  const isEditing = (record: CourseData) => {
    return generateRowKey(record) === editingKey;
  };

  const edit = (record: CourseData) => {
    form.setFieldsValue({
      ...record,
      startTime: record.startTime ? dayjs(record.startTime, 'HH:mm') : null,
      endTime: record.endTime ? dayjs(record.endTime, 'HH:mm') : null,
    });
    setEditingKey(generateRowKey(record));
  };

  const cancel = () => {
    setEditingKey('');
  };

  const save = async (key: string) => {
    try {
      const row = await form.validateFields();
      const newData = [...data];
      const index = newData.findIndex(item => 
        generateRowKey(item) === key
      );

      if (index > -1) {
        const item = newData[index];
        const updatedItem = {
          ...item,
          ...row,
          startTime: row.startTime ? row.startTime.format('HH:mm') : '',
          endTime: row.endTime ? row.endTime.format('HH:mm') : '',
        };
        newData.splice(index, 1, updatedItem);
        setData(newData);
        localStorage.setItem('courseData', JSON.stringify(newData));
        setEditingKey('');
        message.success('数据修改成功');
      }
    } catch (errInfo) {
      console.error('保存失败:', errInfo);
      message.error('数据验证失败，请检查输入');
    }
  };

  // 组件加载时检查是否有已确认的数据
  useEffect(() => {
    const storedData = localStorage.getItem('courseData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setData(parsedData);
        setIsDataConfirmed(true);
      } catch (error) {
        console.error('数据解析错误:', error);
      }
    }
  }, []);

  const formatDateTime = (date: string | number, time: string) => {
    try {
      console.log('处理日期和时间:', { date, time, dateType: typeof date }); // 调试信息

      // 如果date是数字（Excel日期序列号），先转换为JavaScript日期
      let jsDate: Date;
      if (typeof date === 'number') {
        // Excel的日期序列号是从1900-01-01开始的
        const excelEpoch = new Date(1900, 0, 1);
        const millisecondsPerDay = 24 * 60 * 60 * 1000;
        // 减去2天，因为Excel错误地认为1900年是闰年
        jsDate = new Date(excelEpoch.getTime() + (date - 2) * millisecondsPerDay);
      } else {
        // 如果是字符串日期，直接解析
        jsDate = new Date(date);
      }

      console.log('转换后的日期:', jsDate); // 调试信息

      // 解析时间字符串
      let hours = 0, minutes = 0, seconds = 0;
      if (time) {
        const timeParts = time.split(':');
        hours = parseInt(timeParts[0]) || 0;
        minutes = parseInt(timeParts[1]) || 0;
        seconds = parseInt(timeParts[2]) || 0;
      }

      // 设置时间
      jsDate.setHours(hours, minutes, seconds);

      console.log('最终日期时间:', jsDate); // 调试信息

      // 使用dayjs格式化
      return dayjs(jsDate).format('YYYY-MM-DD HH:mm:ss');
    } catch (error) {
      console.error('时间格式化错误:', error);
      return `${date} ${time}`; // 如果格式化失败，返回原始值
    }
  };

  const handleFileChange = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // 获取单元格格式信息
        const cellFormats = firstSheet['!cols'];
        console.log('Excel列格式信息:', cellFormats); // 调试信息
        
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
          raw: false, // 获取格式化后的值
          dateNF: 'yyyy-mm-dd hh:mm:ss' // 指定日期格式
        });
        
        console.log('原始Excel数据:', jsonData); // 调试信息

        const formattedData = jsonData.map((item: any) => {
          // 保存原始日期值用于后续处理
          const rawDate = item['上课日期'];
          const rawStartTime = item['上课时间'];
          const rawEndTime = item['下课时间'];

          // 提取时间部分（HH:mm:ss 或 HH:mm）
          const extractTime = (timeStr: string) => {
            const match = timeStr.match(/\d{2}:\d{2}(:\d{2})?$/);
            return match ? match[0].split(':').slice(0, 2).join(':') : timeStr;
          };

          console.log('原始时间数据:', {
            date: rawDate,
            startTime: rawStartTime,
            endTime: rawEndTime,
            dateType: typeof rawDate
          }); // 调试信息

          return {
            startTime: extractTime(rawStartTime), // 只保存时间部分 (HH:mm)
            endTime: extractTime(rawEndTime),     // 只保存时间部分 (HH:mm)
            week: item['周次'],
            grade: item['年级名称'],
            plannedTeacher: item['计划上课老师'],
            actualTeacher: item['实际上课老师'],
            reason: item['调代课事由'],
            type: item['调代课类型'],
            date: rawDate,
            period: item['时段'],
            weekday: item['星期'],
            class: item['班级名称'],
            subject: item['上课科目'],
            session: item['节次'],
            courseType: item['课程类型'],
            hours: item['课时数']
          };
        });

        console.log('格式化后的数据:', formattedData); // 调试信息

        setData(formattedData);
        setIsDataConfirmed(false);
        message.success('数据解析成功，请确认数据是否正确！');
      } catch (error) {
        console.error('文件解析错误:', error);
        message.error('文件解析失败，请检查文件格式是否正确');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = () => {
    Modal.confirm({
      title: '确认数据',
      content: '确认使用当前数据进行统计吗？确认后将无法修改。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        localStorage.setItem('courseData', JSON.stringify(data));
        setIsDataConfirmed(true);
        message.success('数据确认成功！');
      }
    });
  };

  const props: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    showUploadList: false,
    beforeUpload: (file) => {
      handleFileChange(file);
      return false; // 阻止自动上传
    },
  };

  const columns: (ColumnType<CourseData> & { editable?: boolean })[] = [
    { 
      title: '上课日期', 
      dataIndex: 'date', 
      key: 'date', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.date))).map(date => ({
        text: date,
        value: date,
      })) : [],
      onFilter: (value: Key | boolean, record: CourseData) => record.date === value,
    },
    { 
      title: '上课时间', 
      dataIndex: 'startTime', 
      key: 'startTime', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.startTime))).map(time => ({
        text: time,
        value: time,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.startTime === value,
    },
    { 
      title: '下课时间', 
      dataIndex: 'endTime', 
      key: 'endTime', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.endTime))).map(time => ({
        text: time,
        value: time,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.endTime === value,
    },
    { 
      title: '周次', 
      dataIndex: 'week', 
      key: 'week', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.week))).map(week => ({
        text: String(week),
        value: week,
      })) : [],
      onFilter: (value: number, record: CourseData) => record.week === value,
      sorter: (a: CourseData, b: CourseData) => Number(a.week) - Number(b.week),
    },
    { 
      title: '星期', 
      dataIndex: 'weekday', 
      key: 'weekday', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.weekday))).map(weekday => ({
        text: weekday,
        value: weekday,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.weekday === value,
    },
    { 
      title: '节次', 
      dataIndex: 'session', 
      key: 'session', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.session))).map(session => ({
        text: String(session),
        value: session,
      })) : [],
      onFilter: (value: number, record: CourseData) => record.session === value,
      sorter: (a: CourseData, b: CourseData) => Number(a.session) - Number(b.session),
    },
    { title: '时段', dataIndex: 'period', key: 'period', editable: true },
    { 
      title: '年级', 
      dataIndex: 'grade', 
      key: 'grade', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.grade))).map(grade => ({
        text: grade,
        value: grade,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.grade === value,
    },
    { 
      title: '班级', 
      dataIndex: 'class', 
      key: 'class', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.class))).map(cls => ({
        text: cls,
        value: cls,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.class === value,
    },
    { 
      title: '科目', 
      dataIndex: 'subject', 
      key: 'subject', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.subject))).map(subject => ({
        text: subject,
        value: subject,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.subject === value,
    },
    { 
      title: '课程类型', 
      dataIndex: 'courseType', 
      key: 'courseType', 
      editable: true,
      filters: courseTypes.map(type => ({
        text: type,
        value: type,
      })),
      onFilter: (value: boolean | Key, record: CourseData) => record.courseType === String(value),
    },
    { 
      title: '课时数', 
      dataIndex: 'hours', 
      key: 'hours', 
      editable: true,
      sorter: (a: CourseData, b: CourseData) => Number(a.hours) - Number(b.hours),
    },
    { 
      title: '计划上课教师', 
      dataIndex: 'plannedTeacher', 
      key: 'plannedTeacher', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.plannedTeacher))).map(teacher => ({
        text: teacher,
        value: teacher,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.plannedTeacher === value,
    },
    { 
      title: '实际上课教师', 
      dataIndex: 'actualTeacher', 
      key: 'actualTeacher', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.actualTeacher))).map(teacher => ({
        text: teacher,
        value: teacher,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.actualTeacher === value,
    },
    { 
      title: '调代课类型', 
      dataIndex: 'type', 
      key: 'type', 
      editable: true,
      filterSearch: true,
      filters: data.length > 0 ? Array.from(new Set(data.map(item => item.type))).map(type => ({
        text: type,
        value: type,
      })) : [],
      onFilter: (value: string, record: CourseData) => record.type === value,
    },
    { title: '调代课事由', dataIndex: 'reason', key: 'reason', editable: true },
    {
      title: '操作',
      dataIndex: 'operation',
      fixed: 'right',
      width: 150,
      render: (_: any, record: CourseData) => {
        const editable = isEditing(record);
        return editable ? (
          <span>
            <Button
              type="link"
              onClick={() => save(generateRowKey(record))}
              style={{ marginRight: 8 }}
              icon={<SaveOutlined />}
            >
              保存
            </Button>
            <Button
              type="link"
              onClick={cancel}
              icon={<CloseOutlined />}
            >
              取消
            </Button>
          </span>
        ) : (
          <Button
            type="link"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            icon={<EditOutlined />}
          >
            编辑
          </Button>
        );
      },
    },
  ].map(col => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: CourseData) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  // 使用JavaScript直接触发下载
  const handleDownloadTemplate = () => {
    // 创建一个下载链接
    const link = document.createElement('a');
    link.href = '/template.xlsx';  // 确保文件名与public目录下的一致
    link.download = 'template.xlsx';
    
    // 将链接添加到文档
    document.body.appendChild(link);
    
    // 模拟点击链接
    link.click();
    
    // 清理DOM
    document.body.removeChild(link);
    
    console.log('正在下载模板文件...');
  };

  return (
    <div>
      <Button
        type="primary"
        onClick={handleDownloadTemplate}
        icon={<DownloadOutlined />}
        style={{ marginBottom: 16 }}
      >
        下载模版
      </Button>
      <div style={{ marginBottom: '20px' }}>
        <Upload {...props}>
          <Button icon={<UploadOutlined />}>上传Excel文件</Button>
        </Upload>
        {data.length > 0 && !isDataConfirmed && (
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={handleConfirm}
            style={{ marginLeft: '10px' }}
          >
            确认数据
          </Button>
        )}
      </div>
      
      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: EditableCell,
            },
          }}
          dataSource={data}
          columns={columns}
          rowKey={generateRowKey}
          style={{ marginTop: '20px' }}
          scroll={{ x: 'max-content' }}
          pagination={{
            onChange: cancel,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Form>
    </div>
  );
};

export default DataUpload; 