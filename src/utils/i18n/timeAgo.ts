import en from 'javascript-time-ago/locale/en';
import TimeAgo from 'javascript-time-ago';

TimeAgo.addDefaultLocale(en);
export const timeAgo = new TimeAgo('en-US');
