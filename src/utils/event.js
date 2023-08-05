// 일정 추천을 위한 계산을 하기위해 Event에서 startDateTime, endDateTime만을 추출
function parseEventDates(nonRecurrenceEvent, recurrenceEvent) {
  const events = [];
  nonRecurrenceEvent.forEach((event) => {
    events.push({ startDateTime: event.startDateTime, endDateTime: event.endDateTime });
  });
  recurrenceEvent.forEach((event) => {
    event.recurrenceDateList.forEach((date) => {
      events.push(date);
    });
  });
  return events;
}

// duration 계산 (분 단위의 결과값)
function getDuration(start, end) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// events를 고려하여 빈 시간을 추출
function eventProposal(events, start, end) {
  const result = [];
  if (events.length === 0) {
    result.push({
      startDateTime: start,
      endDateTime: end,
      duration: getDuration(start, end),
    });
    return result;
  }
  if (events[0].startDateTime.getTime() > start.getTime()) {
    result.push({
      startDateTime: start,
      endDateTime: events[0].startDateTime,
      duration: getDuration(start, events[0].startDateTime),
    });
  }
  let currEnd = events[0].endDateTime;
  events.forEach((event) => {
    if (event.endDateTime.getTime() > currEnd.getTime()) {
      if (event.startDateTime.getTime() > currEnd.getTime()) {
        result.push({
          startDateTime: currEnd,
          endDateTime: event.startDateTime,
          duration: getDuration(currEnd, event.startDateTime),
        });
      }
      currEnd = event.endDateTime;
    }
  });
  if (currEnd.getTime() < end.getTime()) {
    result.push({
      startDateTime: currEnd,
      endDateTime: end,
      duration: getDuration(currEnd, end),
    });
  }
  return result;
}

module.exports = {
  parseEventDates,
  eventProposal,
};
