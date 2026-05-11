import type { AppointmentWithDetails, BusinessHours } from '@repo/salon-core/types';
import { clampToHours, hmToMinutes, hourLabels, workingMinutes } from './helpers';

export const HOUR_HEIGHT = 72;
export const AXIS_WIDTH = 52;
export const PX_PER_MINUTE = HOUR_HEIGHT / 60;
export const SLOT_SNAP_MINUTES = 15;

/**
 * Convert a y-pixel offset within the time grid into a snapped HH:mm string.
 * Returns null when the offset falls outside the working window or leaves no
 * room for a minimum-length appointment before workingEnd.
 */
export function ySnapToHm(yPx: number, hours: BusinessHours): string | null {
  const startMin = hmToMinutes(hours.workingStart);
  const endMin = hmToMinutes(hours.workingEnd);
  const raw = startMin + yPx / PX_PER_MINUTE;
  const snapped = Math.floor(raw / SLOT_SNAP_MINUTES) * SLOT_SNAP_MINUTES;
  const latest = endMin - SLOT_SNAP_MINUTES;
  const clamped = Math.max(startMin, Math.min(latest, snapped));
  if (clamped < startMin || clamped > latest) return null;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type LaidOutAppointment = {
  appointment: AppointmentWithDetails;
  topPx: number;
  heightPx: number;
  leftPercent: number;
  widthPercent: number;
};

/** Lay out appointments avoiding overlap by greedy lane assignment */
export function layoutAppointments(
  appointments: AppointmentWithDetails[],
  hours: BusinessHours
): LaidOutAppointment[] {
  const sorted = [...appointments].sort((a, b) => a.startTime.localeCompare(b.startTime));

  type Item = {
    appointment: AppointmentWithDetails;
    startMin: number;
    endMin: number;
    lane: number;
    laneCount: number;
    cluster: number;
  };
  const items: Item[] = [];
  for (const a of sorted) {
    const startMin = hmToMinutes(a.startTime);
    const endMin = hmToMinutes(a.endTime);
    const clamped = clampToHours(startMin, endMin, hours);
    if (!clamped) continue;
    items.push({
      appointment: a,
      startMin: clamped.start,
      endMin: clamped.end,
      lane: 0,
      laneCount: 1,
      cluster: 0,
    });
  }

  // Group into clusters of overlapping events
  let clusterId = 0;
  let clusterEnd = -Infinity;
  let clusterStart = 0;
  for (let i = 0; i < items.length; i++) {
    if (items[i].startMin >= clusterEnd) {
      // start a new cluster
      clusterId++;
      clusterStart = i;
      clusterEnd = items[i].endMin;
    } else {
      clusterEnd = Math.max(clusterEnd, items[i].endMin);
    }
    items[i].cluster = clusterId;
    void clusterStart;
  }

  // Within each cluster, assign lanes
  const byCluster = new Map<number, Item[]>();
  for (const it of items) {
    const list = byCluster.get(it.cluster) ?? [];
    list.push(it);
    byCluster.set(it.cluster, list);
  }
  for (const list of byCluster.values()) {
    const lanes: number[] = []; // last endMin per lane
    for (const it of list) {
      let assigned = -1;
      for (let li = 0; li < lanes.length; li++) {
        if (lanes[li] <= it.startMin) {
          assigned = li;
          lanes[li] = it.endMin;
          break;
        }
      }
      if (assigned === -1) {
        assigned = lanes.length;
        lanes.push(it.endMin);
      }
      it.lane = assigned;
    }
    const laneCount = lanes.length;
    for (const it of list) it.laneCount = laneCount;
  }

  const offsetMin = hmToMinutes(hours.workingStart);
  return items.map((it) => {
    const laneWidth = 100 / it.laneCount;
    return {
      appointment: it.appointment,
      topPx: (it.startMin - offsetMin) * PX_PER_MINUTE,
      heightPx: (it.endMin - it.startMin) * PX_PER_MINUTE,
      leftPercent: it.lane * laneWidth,
      widthPercent: laneWidth,
    };
  });
}

export { hourLabels, workingMinutes };
