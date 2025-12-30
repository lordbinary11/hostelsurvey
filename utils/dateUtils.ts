import dayjs from 'dayjs';

export const formatDate = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};

export const formatTime = (date: Date): string => {
  return dayjs(date).format('HH:mm:ss');
};

export const formatDateTime = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

