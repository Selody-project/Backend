// duration 계산 (분 단위의 결과값)
function getDuration(start, end) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// events를 고려하여 빈 시간을 추출
function eventProposal(events, start, end, minimumDuration) {
  const result = [];
  if (events.length === 0) {
    const duration = getDuration(start, end);
    if (duration >= minimumDuration) {
      result.push({
        startDateTime: start,
        endDateTime: end,
        duration,
      });
    }
    return result;
  }
  if (events[0].startDateTime.getTime() > start.getTime()) {
    const duration = getDuration(start, events[0].startDateTime);
    if (duration >= minimumDuration) {
      result.push({
        startDateTime: start,
        endDateTime: events[0].startDateTime,
        duration,
      });
    }
  }
  let currEnd = events[0].endDateTime;
  events.forEach((event) => {
    if (event.endDateTime.getTime() > currEnd.getTime()) {
      if (event.startDateTime.getTime() > currEnd.getTime()) {
        const duration = getDuration(currEnd, event.startDateTime);
        if (duration >= minimumDuration) {
          result.push({
            startDateTime: currEnd,
            endDateTime: event.startDateTime,
            duration,
          });
        }
      }
      currEnd = event.endDateTime;
    }
  });
  if (currEnd.getTime() < end.getTime()) {
    const duration = getDuration(currEnd, end);
    if (duration >= minimumDuration) {
      result.push({
        startDateTime: currEnd,
        endDateTime: end,
        duration,
      });
    }
  }
  return result;
}

module.exports = {
  eventProposal,
};
