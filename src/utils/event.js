// duration 계산 (분 단위의 결과값)
function getDuration(start, end) {
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

// events를 고려하여 빈 시간을 추출
// 회의실 배정 문제를 풀이하면 쉽게 이해할 수 있습니다.
// 그리디 알고리즘을 이용하고 있습니다.
function eventProposal(events, start, end, minimumDuration) {
  // 여기서 events 매개변수에 들어오는 리스트는, startDateTime을 기준으로 정렬된
  // 리스트라고 가정합니다.

  const result = [];
  // 해당 구간에 아무런 일정도 없다면, 따로 계산할 필요가 없으므로
  // result에 구간값을 그대로 push하여 return
  if (events.length === 0) {
    const duration = getDuration(start, end);
    // 최소 구간 길이 이상인 경우만 result에 push
    if (duration >= minimumDuration) {
      result.push({
        startDateTime: start,
        endDateTime: end,
        duration,
      });
    }
    return result;
  }
  // 이 밑으로는 해당 구간에 일정이 있는 경우

  // 만약 첫 일정의 시작 시간이 추천 시작 시점보다 이후에 존재한다면
  // 추천 시작 시점 ~ 첫 일정 시작 시간 까지 비어있는 구간이 생기므로, 해당 구간을 push
  if (events[0].startDateTime.getTime() > start.getTime()) {
    const duration = getDuration(start, events[0].startDateTime);
    // 최소 구간 길이 이상인 경우만 result에 push
    if (duration >= minimumDuration) {
      result.push({
        startDateTime: start,
        endDateTime: events[0].startDateTime,
        duration,
      });
    }
  }
  // 일정을 차례대로 순회하면서 현제까지 순회한 일정중에
  // 가장 늦게 끝나는 일정의 endDateTime을 체크 (currEnd)
  // 해당 값보다 다음 일정의 startDateTime이 이후에 존재한다면,
  // currEnd ~ startDateTime 까지 비어있는 구간이 발생, 해당 구간을 push
  let currEnd = events[0].endDateTime;
  events.forEach((event) => {
    if (event.endDateTime.getTime() > currEnd.getTime()) {
      if (event.startDateTime.getTime() > currEnd.getTime()) {
        const duration = getDuration(currEnd, event.startDateTime);
        // 최소 구간 길이 이상인 경우만 result에 push
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

  // 모든 일정을 순회한 후에 currEnd의 값이 추천 종점 시간 보다 이전이라면
  // currEnd ~ 추천 종점 시간 까지 비어있는 구간이 발생, 해당 구간을 push
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

  // 이로써 모든 일정을 순회하면서 비어있는 구간을 찾을 수 있음
  return result;
}

module.exports = {
  eventProposal,
};
