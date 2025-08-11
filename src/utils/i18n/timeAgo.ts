import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo('en-US');

export function formatDateAsTimeAgo(dateString: string) {
  const date = new Date(dateString);

  if (!dateString || isNaN(date.getTime())) {
    return '';
  }
  return timeAgo.format(date);
}
