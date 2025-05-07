import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Table, Card, Row, Col, Button, message } from 'antd';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface TeacherStats {
  teacher: string;
  [key: string]: string | number; // 用于存储各种课程类型的课时
}

const Statistics: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>(['all']);
  const [statistics, setStatistics] = useState<TeacherStats[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);

  // 将Excel日期序列号转换为JavaScript日期
  const excelDateToJSDate = (excelDate: number): Date => {
    const excelEpoch = new Date(1899, 11, 30); // Excel的起始日期
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + excelDate * millisecondsPerDay);
  };

  // 检查数据是否存在
  useEffect(() => {
    const checkData = () => {
      const data = localStorage.getItem('courseData');
      console.log('Statistics页面读取的localStorage数据:', data); // 调试信息
      if (!data) {
        message.warning('请先上传并确认数据');
        return;
      }
      try {
        const parsedData = JSON.parse(data);
        console.log('Statistics页面解析后的数据:', parsedData); // 调试信息
        if (!parsedData || parsedData.length === 0) {
          message.warning('没有可用的数据，请先上传并确认数据');
          return;
        }

        // 检查所有日期格式
        const dateFormatCheck = parsedData.filter((item: any) => {
          if (item.actualTeacher === '蔡永红') {
            const dateStr = item.date;
            console.log('蔡永红的原始日期记录:', {
              date: dateStr,
              rawData: item
            });
            return true;
          }
          return false;
        });

        console.log('蔡永红的所有课程记录:', dateFormatCheck);

        setCourseData(parsedData);
        const uniqueTeachers = Array.from(new Set(parsedData.map((item: any) => item.actualTeacher))) as string[];
        setTeachers(uniqueTeachers);
        console.log('可选的教师列表:', uniqueTeachers); // 调试信息
      } catch (error) {
        console.error('Statistics页面数据解析错误:', error);
        message.error('数据解析错误，请重新上传并确认数据');
      }
    };

    // 初始检查
    checkData();
    
    // 添加事件监听，当localStorage变化时重新检查数据
    window.addEventListener('storage', checkData);
    return () => window.removeEventListener('storage', checkData);
  }, []);

  // 处理教师选择变化
  const handleTeacherChange = (values: string[]) => {
    // 处理"全选"逻辑
    if (values.includes('all')) {
      if (selectedTeachers.includes('all')) {
        // 如果之前已经选了"全选"，现在又选了其他选项，则移除"全选"
        setSelectedTeachers(values.filter(v => v !== 'all'));
      } else {
        // 如果之前没有选"全选"，现在选了"全选"，则只保留"全选"
        setSelectedTeachers(['all']);
      }
    } else {
      setSelectedTeachers(values);
    }
  };

  const calculateStatistics = () => {
    if (courseData.length === 0) {
      message.warning('请先上传并确认数据');
      return;
    }
    if (!dateRange) {
      message.warning('请选择日期范围');
      return;
    }
    if (selectedTeachers.length === 0) {
      message.warning('请选择至少一位教师');
      return;
    }

    try {
      const [startDate, endDate] = dateRange;
      const startDateStr = startDate.format('YYYY-MM-DD');
      const endDateStr = endDate.format('YYYY-MM-DD');

      console.log('查询条件:', {
        dateRange: {
          start: startDateStr,
          end: endDateStr
        },
        teacher: selectedTeachers,
        totalRecords: courseData.length
      });

      const filteredData = courseData.filter((item: any) => {
        const parseDate = (dateStr: string) => {
          try {
            const [month, day, year] = dateStr.split('/').map(Number);
            const fullYear = 2000 + year;
            const parsedDate = dayjs(`${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
            
            // 添加日期解析日志
            if (item.actualTeacher === '蔡永红') {
              console.log('日期解析:', {
                originalDate: dateStr,
                parsedDate: parsedDate.format('YYYY-MM-DD'),
                month,
                day,
                year: fullYear,
                isValid: parsedDate.isValid(),
                rawData: item
              });
            }
            
            return parsedDate;
          } catch (error) {
            console.error('日期解析错误:', {
              dateStr,
              error,
              rawData: item
            });
            return null;
          }
        };
        const courseDate = parseDate(item.date);
        if (!courseDate || !courseDate.isValid()) {
          return false;
        }
        
        // 检查日期是否在范围内
        const isInDateRange = courseDate.isSameOrAfter(startDate, 'day') && 
                            courseDate.isSameOrBefore(endDate, 'day');
        
        // 检查教师是否匹配（全选或者在选中列表中）
        const isTeacherMatch = selectedTeachers.includes('all') || 
                             selectedTeachers.includes(item.actualTeacher);

        // 详细记录每条数据的处理过程
        if (item.actualTeacher === '蔡永红') {
          console.log('处理蔡永红的课程记录:', {
            date: item.date,
            courseDate: courseDate.format('YYYY-MM-DD'),
            startDate: startDate.format('YYYY-MM-DD'),
            endDate: endDate.format('YYYY-MM-DD'),
            isInDateRange,
            isTeacherMatch,
            included: isInDateRange && isTeacherMatch,
            rawData: item
          });
        }

        return isInDateRange && isTeacherMatch;
      });

      console.log('筛选后的数据总数:', filteredData.length);

      // 特别检查蔡永红的课程记录
      const caiYongHongRecords = filteredData.filter(item => item.actualTeacher === '蔡永红');
      console.log('蔡永红的课程记录:', caiYongHongRecords.map(item => ({
        date: item.date,
        courseType: item.courseType,
        hours: item.hours,
        rawHours: item['课时数'] // 检查原始数据中的课时数
      })));

      if (filteredData.length === 0) {
        message.info('没有找到符合条件的记录');
        setStatistics([]);
        return;
      }

      // 获取所有课程类型
      const courseTypes = Array.from(new Set(filteredData.map(item => item.courseType)));
      console.log('所有课程类型:', courseTypes);
      
      // 按教师分组统计各类型课时
      const teacherStats = filteredData.reduce((acc: any, item: any) => {
        const teacher = item.actualTeacher;
        if (!acc[teacher]) {
          acc[teacher] = {
            teacher,
            ...Object.fromEntries(courseTypes.map(type => [`${type}Hours`, 0]))
          };
        }

        // 确保课时是数字，如果是字符串先转换
        let hours = 0;
        if (typeof item.hours === 'string') {
          hours = parseFloat(item.hours) || 0;
        } else if (typeof item['课时数'] === 'string') {
          hours = parseFloat(item['课时数']) || 0;
        } else {
          hours = Number(item.hours || item['课时数']) || 0;
        }

        // 记录课时累加过程
        if (teacher === '蔡永红') {
          console.log('累加蔡永红课时:', {
            courseType: item.courseType,
            currentHours: hours,
            previousTotal: acc[teacher][`${item.courseType}Hours`],
            newTotal: acc[teacher][`${item.courseType}Hours`] + hours,
            rawData: item
          });
        }

        acc[teacher][`${item.courseType}Hours`] += hours;
        return acc;
      }, {});

      const result = Object.values(teacherStats) as TeacherStats[];
      result.sort((a, b) => a.teacher.localeCompare(b.teacher));
      
      // 添加总课时列并检查蔡永红的统计结果
      result.forEach(stat => {
        const totalHours = courseTypes.reduce((sum, type) => sum + (Number(stat[`${type}Hours`]) || 0), 0);
        stat['totalHours'] = totalHours;

        if (stat.teacher === '蔡永红') {
          console.log('蔡永红最终统计结果:', {
            ...stat,
            courseTypes: courseTypes.map(type => ({
              type,
              hours: stat[`${type}Hours`]
            }))
          });
        }
      });

      console.log('统计结果:', result);
      setStatistics(result);

    } catch (error) {
      console.error('统计计算错误:', error);
      message.error('统计计算错误');
    }
  };

  // 动态生成表格列配置
  const generateColumns = (data: any[]) => {
    if (!data || data.length === 0) return [];

    // 基础列：教师姓名
    const baseColumns = [
      { title: '老师姓名', dataIndex: 'teacher', key: 'teacher', width: 120 }
    ];

    // 获取所有课程类型
    const courseTypes = Object.keys(data[0])
      .filter(key => key.endsWith('Hours') && key !== 'totalHours')
      .map(key => key.replace('Hours', ''));

    // 为每个课程类型生成列
    const typeColumns = courseTypes.map(type => ({
      title: type,
      dataIndex: `${type}Hours`,
      key: `${type}Hours`,
      width: 100
    }));

    // 添加总课时列
    const totalColumn = {
      title: '总课时',
      dataIndex: 'totalHours',
      key: 'totalHours',
      width: 100
    };

    return [...baseColumns, ...typeColumns, totalColumn];
  };

  return (
    <div>
      <Button
        type="primary"
        href="/课时导入模版.xlsx"
        download="课时导入模版.xlsx"
        style={{ marginBottom: 16 }}
      >
        下载模版
      </Button>
      <Card title="统计条件" style={{ marginBottom: '20px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <RangePicker
              value={dateRange}
              onChange={(dates) => {
                if (dates && dates[0] && dates[1]) {
                  setDateRange([dates[0], dates[1]]);
                } else {
                  setDateRange(null);
                }
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={8}>
            <Select
              mode="multiple"
              value={selectedTeachers}
              onChange={handleTeacherChange}
              style={{ width: '100%' }}
              showSearch
              placeholder="选择或搜索教师（可多选）"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              maxTagCount="responsive"
              options={[
                { value: 'all', label: '全选' },
                ...teachers.map(teacher => ({ value: teacher, label: teacher }))
              ]}
            />
          </Col>
          <Col span={8}>
            <Button type="primary" onClick={calculateStatistics}>
              查询
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        dataSource={statistics}
        columns={generateColumns(statistics)}
        rowKey="teacher"
        scroll={{ x: 'max-content' }}
        pagination={false}
      />
    </div>
  );
};

export default Statistics; 