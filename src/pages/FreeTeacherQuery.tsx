import React, { useState } from 'react';
import { DatePicker, TimePicker, Table, Button, Space, message } from 'antd';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import type { Dayjs } from 'dayjs';

// 扩展 dayjs 功能
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { RangePicker } = DatePicker;

interface QueryTimeRange {
  startDate: Dayjs;
  startTime: Dayjs;
  endDate: Dayjs;
  endTime: Dayjs;
}

const isTimeOverlap = (courseStartTime: Dayjs, courseEndTime: Dayjs, queryStartTime: Dayjs, queryEndTime: Dayjs) => {
  // 如果课程的结束时间早于开始时间，则该记录无效
  if (courseEndTime.isSameOrBefore(courseStartTime)) {
    return false;
  }

  // 如果查询的结束时间早于开始时间，则该查询无效
  if (queryEndTime.isSameOrBefore(queryStartTime)) {
    return false;
  }

  // 检查是否有重叠
  // 情况1：课程开始时间在查询时间范围内
  // 情况2：课程结束时间在查询时间范围内
  // 情况3：课程时间完全包含查询时间范围
  return (
    (courseStartTime.isSameOrAfter(queryStartTime) && courseStartTime.isBefore(queryEndTime)) ||
    (courseEndTime.isAfter(queryStartTime) && courseEndTime.isSameOrBefore(queryEndTime)) ||
    (courseStartTime.isSameOrBefore(queryStartTime) && courseEndTime.isSameOrAfter(queryEndTime))
  );
};

const FreeTeacherQuery: React.FC = () => {
  const [timeRange, setTimeRange] = useState<QueryTimeRange | null>(null);
  const [freeTeachers, setFreeTeachers] = useState<string[]>([]);

  const handleQuery = () => {
    if (!timeRange) {
      message.warning('请选择完整的时间范围');
      return;
    }

    const data = localStorage.getItem('courseData');
    if (!data) {
      message.warning('没有可用的课程数据');
      return;
    }

    try {
      const courseData = JSON.parse(data);
      
      // 获取所有教师（不将空字符串转换为"无"）
      const allTeachers = Array.from(new Set(courseData.map((item: any) => 
        item.actualTeacher || ''
      ))).filter(teacher => teacher !== '') as string[];
      
      // 构建查询时间范围
      const queryStart = timeRange.startDate
        .hour(timeRange.startTime.hour())
        .minute(timeRange.startTime.minute());
      const queryEnd = timeRange.endDate
        .hour(timeRange.endTime.hour())
        .minute(timeRange.endTime.minute());

      console.log('查询时间范围:', {
        start: queryStart.format('YYYY-MM-DD HH:mm'),
        end: queryEnd.format('YYYY-MM-DD HH:mm')
      });

      // 解析日期字符串 '4/1/25' 格式
      const parseDate = (dateStr: string) => {
        const [month, day, year] = dateStr.split('/').map(Number);
        const fullYear = 2000 + year;
        return new Date(fullYear, month - 1, day);
      };

      // 按教师分组课程数据
      const teacherCourses = new Map<string, any[]>();
      courseData.forEach((item: any) => {
        // 只处理查询日期当天的课程记录
        const courseDate = dayjs(parseDate(item.date));
        if (courseDate.format('YYYY-MM-DD') !== queryStart.format('YYYY-MM-DD')) {
          return;
        }
        
        const teacher = item.actualTeacher || '';
        if (teacher === '') {
          return;
        }
        
        if (!teacherCourses.has(teacher)) {
          teacherCourses.set(teacher, []);
        }
        teacherCourses.get(teacher)?.push(item);
      });

      // 获取在指定时间段内有课的教师
      const busyTeachers = Array.from(teacherCourses.entries())
        .filter(([teacher, courses]) => {
          // 检查该教师在查询时间范围内是否有任何课程时间重叠
          return courses.some((item: any) => {
            // 解析时间字符串（HH:mm 格式）
            const parseTime = (timeStr: string) => {
              // 如果时间包含日期，只提取时间部分
              const timeMatch = timeStr.match(/(\d{2}):(\d{2})/);
              if (!timeMatch) {
                console.log('无效的时间格式:', timeStr);
                return null;
              }
              return {
                hours: parseInt(timeMatch[1]),
                minutes: parseInt(timeMatch[2])
              };
            };
            
            // 获取并解析时间
            const startTime = parseTime(item.startTime);
            const endTime = parseTime(item.endTime);
            
            // 如果时间格式无效，跳过该记录
            if (!startTime || !endTime) {
              console.log('跳过无效时间记录:', {
                teacher,
                startTime: item.startTime,
                endTime: item.endTime
              });
              return false;
            }
            
            // 组合课程的日期和时间
            const courseStart = queryStart
              .hour(startTime.hours)
              .minute(startTime.minutes);
            const courseEnd = queryStart
              .hour(endTime.hours)
              .minute(endTime.minutes);

            // 如果结束时间早于开始时间，说明数据有误，跳过该记录
            if (courseEnd.isSameOrBefore(courseStart)) {
              console.log('跳过无效课程记录:', {
                teacher,
                date: queryStart.format('YYYY-MM-DD'),
                start: item.startTime,
                end: item.endTime
              });
              return false;
            }

            // 检查时间是否重叠
            const hasOverlap = isTimeOverlap(courseStart, courseEnd, queryStart, queryEnd);
            
            if (hasOverlap) {
              console.log('发现时间冲突:', {
                teacher,
                courseTime: `${courseStart.format('HH:mm')}-${courseEnd.format('HH:mm')}`,
                queryTime: `${queryStart.format('HH:mm')}-${queryEnd.format('HH:mm')}`
              });
            }

            return hasOverlap;
          });
        })
        .map(([teacher]) => teacher);

      // 计算空闲教师
      const uniqueBusyTeachers = Array.from(new Set(busyTeachers));
      console.log('忙碌教师列表:', uniqueBusyTeachers);
      
      const freeTeachersList = allTeachers
        .filter(teacher => !uniqueBusyTeachers.includes(teacher))
        .sort();

      console.log('所有教师数量:', allTeachers.length);
      console.log('忙碌教师数量:', uniqueBusyTeachers.length);
      console.log('空闲教师数量:', freeTeachersList.length);
      console.log('空闲教师:', freeTeachersList);

      setFreeTeachers(freeTeachersList);

      if (freeTeachersList.length === 0) {
        message.info('该时间段内没有空闲教师');
      } else {
        message.success(`找到 ${freeTeachersList.length} 位空闲教师`);
      }
    } catch (error) {
      console.error('查询错误:', error);
      message.error('查询出错，请重试');
    }
  };

  const columns = [
    {
      title: '空闲教师',
      dataIndex: 'teacher',
      key: 'teacher',
    },
  ];

  const dataSource = freeTeachers.map(teacher => ({
    key: teacher,
    teacher: teacher,
  }));

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: '20px' }}>
        <Space size="large">
          <Space>
            <span>开始时间：</span>
            <DatePicker
              value={timeRange?.startDate}
              onChange={(date) => {
                if (date) {
                  setTimeRange(prev => ({
                    ...prev,
                    startDate: date,
                    endDate: prev?.endDate || date
                  } as QueryTimeRange));
                }
              }}
            />
            <TimePicker
              value={timeRange?.startTime}
              format="HH:mm"
              onChange={(time) => {
                if (time) {
                  setTimeRange(prev => ({
                    ...prev,
                    startTime: time
                  } as QueryTimeRange));
                }
              }}
            />
          </Space>
          <Space>
            <span>结束时间：</span>
            <DatePicker
              value={timeRange?.endDate}
              onChange={(date) => {
                if (date) {
                  setTimeRange(prev => ({
                    ...prev,
                    endDate: date
                  } as QueryTimeRange));
                }
              }}
            />
            <TimePicker
              value={timeRange?.endTime}
              format="HH:mm"
              onChange={(time) => {
                if (time) {
                  setTimeRange(prev => ({
                    ...prev,
                    endTime: time
                  } as QueryTimeRange));
                }
              }}
            />
          </Space>
        </Space>
        <Button type="primary" onClick={handleQuery}>
          查询空闲教师
        </Button>
      </Space>

      <Table
        dataSource={dataSource}
        columns={columns}
        pagination={false}
      />
    </div>
  );
};

export default FreeTeacherQuery; 