import React, { useState, useEffect } from 'react';
import { DatePicker, Select, Button, message, Space } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
import './ScheduleQuery.css';

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
  const [weekRange, setWeekRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [schedule, setSchedule] = useState<ScheduleData[]>([]);
  const [teachers, setTeachers] = useState<string[]>([]);
  const [showTable, setShowTable] = useState<boolean>(false);

  useEffect(() => {
    const data = localStorage.getItem('courseData');
    if (data) {
      const courseData = JSON.parse(data).filter((item: any) => item.actualTeacher && item.actualTeacher.trim() !== '');
      const uniqueTeachers = Array.from(new Set(courseData.map((item: any) => item.actualTeacher))).filter(teacher => typeof teacher === 'string') as string[];
      setTeachers(uniqueTeachers);
    }
  }, []);

  const handleQuery = () => {
    if (!weekRange || weekRange.length !== 2) {
      message.warning('请选择一周的起止日期');
      return;
    }
    if (!selectedTeacher) {
      message.warning('请选择教师');
      return;
    }
    setShowTable(false);
    setSchedule([]);
    const data = localStorage.getItem('courseData');
    if (data) {
      const courseData = JSON.parse(data).filter((item: any) => item.actualTeacher && item.actualTeacher.trim() !== '');
      const filteredData = courseData.filter((item: any) => {
        const parseDate = (dateStr: string) => {
          const [month, day, year] = dateStr.split('/').map(Number);
          const fullYear = 2000 + year;
          return dayjs(`${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`);
        };
        const courseDate = parseDate(item.date);
        return courseDate.isBetween(weekRange[0], weekRange[1], 'day', '[]') &&
               item.actualTeacher === selectedTeacher;
      });
      setSchedule(filteredData);
      setShowTable(true);
      if (filteredData.length === 0) {
        message.info('该教师在所选周没有课程安排');
      }
    }
  };

  const daysOfWeek = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
  const getCellContent = (weekday: string, session: string) => {
    const found = schedule.find(item => item.weekday === weekday && item.session?.toString() === session.replace(/[^\d]/g, ''));
    if (found) {
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{found.class}</div>
          <div style={{ fontSize: 13 }}>{found.subject}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{found.courseType}</div>
        </div>
      );
    }
    return null;
  };

  const getWeekDates = () => {
    if (!weekRange || weekRange.length !== 2) return daysOfWeek.map(() => '');
    const start = weekRange[0].startOf('day');
    return daysOfWeek.map((_, idx) => start.add(idx, 'day').format('M月D日'));
  };
  const weekDates = getWeekDates();

  // 新增：获取当前选中教师姓名
  const teacherName = selectedTeacher || '';

  // 统计本周所有课表数据（不只当前老师），每个时段下所有出现过的 session（节次），并去重、排序
  const periodSessionFull = React.useMemo(() => {
    const periodOrder = ['早晨', '上午', '下午', '晚上'];
    // 统计所有课表数据
    const data = localStorage.getItem('courseData');
    let allData: ScheduleData[] = [];
    if (data) {
      allData = JSON.parse(data).filter((item: any) => item.actualTeacher && item.actualTeacher.trim() !== '');
    }
    // 按时段分组，收集所有节次
    const map: Record<string, string[]> = {};
    allData.forEach(item => {
      if (!map[item.period]) {
        map[item.period] = [];
      }
      map[item.period].push(item.session.toString());
    });
    // 排序节次（数字优先，非数字按原始顺序）
    const sortSessions = (arr: string[]) => {
      return Array.from(new Set(arr)).sort((a, b) => {
        const na = Number(a), nb = Number(b);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        if (!isNaN(na)) return -1;
        if (!isNaN(nb)) return 1;
        return arr.indexOf(a) - arr.indexOf(b);
      });
    };
    return periodOrder
      .filter(period => map[period]?.length > 0)
      .map(period => ({
        period,
        sessions: sortSessions(map[period]),
      }));
  }, [schedule]);

  return (
    <div>
      <Space style={{ marginBottom: '20px' }}>
        <DatePicker.RangePicker
          value={weekRange}
          onChange={dates => setWeekRange(dates as [Dayjs, Dayjs])}
          style={{ marginRight: '16px' }}
          allowClear={false}
          format="YYYY-MM-DD"
          placeholder={["选择周一", "选择周日"]}
          disabledDate={current => current && current.day() !== 1 && current.day() !== 0}
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
        <div className="schedule-table-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th colSpan={2} style={{ textAlign: 'center', fontWeight: 700, fontSize: 16 }}>{teacherName}</th>
                {daysOfWeek.map((day, idx) => (
                  <th key={day}>
                    <div>{day}</div>
                    <div style={{fontSize:12, color:'#888', fontWeight:400}}>{weekDates[idx]}</div>
                  </th>
                ))}
              </tr>
              <tr>
                <th style={{width: 80}}>时段</th>
                <th style={{width: 80}}>节次</th>
                {daysOfWeek.map((_, idx) => <th key={idx}></th>)}
              </tr>
            </thead>
            <tbody>
              {periodSessionFull.map(periodObj => (
                periodObj.sessions.map((session, sessionIdx) => (
                  <tr key={periodObj.period + session}>
                    {sessionIdx === 0 && (
                      <td rowSpan={periodObj.sessions.length} style={{fontWeight: 600, background: '#f3f6fa'}}>{periodObj.period}</td>
                    )}
                    <td>{session}</td>
                    {daysOfWeek.map(day => {
                      const found = schedule.find(item => item.weekday === day && item.period === periodObj.period && item.session.toString() === session);
                      return (
                        <td key={day + periodObj.period + session}>
                          {found ? (
                            <div>
                              <div style={{ fontWeight: 600 }}>{found.subject}</div>
                              <div style={{ fontSize: 13 }}>{found.class}</div>
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ScheduleQuery; 