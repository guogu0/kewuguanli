import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Table, Button, message, Space } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

interface ScheduleData {
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

const ScheduleQuery: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleData[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);

  useEffect(() => {
    const data = localStorage.getItem('courseData');
    if (data) {
      const courseData = JSON.parse(data);
      const uniqueTeachers = Array.from(new Set(courseData.map((item: any) => item.actualTeacher))).filter(teacher => typeof teacher === 'string') as string[];
      setTeachers(uniqueTeachers);
    }
  }, []);

  const handleQuery = () => {
    if (!selectedDate) {
      message.warning('请选择日期');
      return;
    }
    if (!selectedTeacher) {
      message.warning('请选择教师');
      return;
    }

    // 重置表格显示状态
    setShowTable(false);
    setSchedule([]);

    const data = localStorage.getItem('courseData');
    if (data) {
      const courseData = JSON.parse(data);
      const filteredData = courseData.filter((item: any) => {
        // 解析日期字符串 'M/D/YY' 格式
        const parseDate = (dateStr: string) => {
          const [month, day, year] = dateStr.split('/').map(Number);
          const fullYear = 2000 + year;
          return dayjs(`${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
        };
        
        const courseDate = parseDate(item.date);
        const selectedDateStr = selectedDate.format('YYYY-MM-DD');
        const courseDateStr = courseDate.format('YYYY-MM-DD');
        
        console.log('Date comparison:', {
          courseDate: courseDateStr,
          selectedDate: selectedDateStr,
          isMatch: courseDateStr === selectedDateStr
        });
        
        return courseDateStr === selectedDateStr && 
               item.actualTeacher === selectedTeacher;
      });

      const formattedData = filteredData.map((item: any) => ({
        date: item.date,
        startTime: item.startTime,
        endTime: item.endTime,
        week: item.week,
        weekday: item.weekday,
        session: item.session,
        period: item.period,
        grade: item.grade,
        class: item.class,
        subject: item.subject,
        courseType: item.courseType,
        hours: item.hours,
        plannedTeacher: item.plannedTeacher,
        actualTeacher: item.actualTeacher,
        type: item.type,
        reason: item.reason
      }));

      setSchedule(formattedData);
      setShowTable(true);

      if (formattedData.length === 0) {
        message.info('该教师在所选日期没有课程安排');
      }
    }
  };

  const columns = [
    { title: '上课日期', dataIndex: 'date', key: 'date' },
    { title: '上课时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '下课时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '周次', dataIndex: 'week', key: 'week' },
    { title: '星期', dataIndex: 'weekday', key: 'weekday' },
    { title: '节次', dataIndex: 'session', key: 'session' },
    { title: '时段', dataIndex: 'period', key: 'period' },
    { title: '年级', dataIndex: 'grade', key: 'grade' },
    { title: '班级', dataIndex: 'class', key: 'class' },
    { title: '科目', dataIndex: 'subject', key: 'subject' },
    { title: '课程类型', dataIndex: 'courseType', key: 'courseType' },
    { title: '课时数', dataIndex: 'hours', key: 'hours' },
    { title: '计划上课教师', dataIndex: 'plannedTeacher', key: 'plannedTeacher' },
    { title: '实际上课教师', dataIndex: 'actualTeacher', key: 'actualTeacher' },
    { title: '调代课类型', dataIndex: 'type', key: 'type' },
    { title: '调代课事由', dataIndex: 'reason', key: 'reason' }
  ];

  return (
    <div>
      <Space style={{ marginBottom: '20px' }}>
        <DatePicker
          value={selectedDate}
          onChange={setSelectedDate}
          style={{ marginRight: '16px' }}
        />
        <Select
          value={selectedTeacher}
          onChange={setSelectedTeacher}
          style={{ width: 200 }}
          placeholder="选择教师"
          showSearch
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={teachers.map(teacher => ({ value: teacher, label: teacher }))}
        />
        <Button type="primary" onClick={handleQuery}>
          查询
        </Button>
      </Space>

      {showTable && (
        <Table
          dataSource={schedule}
          columns={columns}
          rowKey={(record) => `${record.date}-${record.startTime}-${record.endTime}-${record.session}-${record.class}-${record.subject}`}
          scroll={{ x: 'max-content' }}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      )}
    </div>
  );
};

export default ScheduleQuery; 