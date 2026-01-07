"use client";
import { useCallback, useRef, useEffect } from "react";
import { analyticsAPI } from "@/lib/api";

interface QueuedEvent {
  tenantId: string;
  eventName: string;
  eventData: Record<string, any>;
  timestamp: number;
}

const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 5000;

// Global event queue
let eventQueue: QueuedEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = [...eventQueue];
  eventQueue = [];
  
  // Send events in parallel (grouped by tenant)
  const byTenant = eventsToSend.reduce((acc, e) => {
    if (!acc[e.tenantId]) acc[e.tenantId] = [];
    acc[e.tenantId].push(e);
    return acc;
  }, {} as Record<string, QueuedEvent[]>);
  
  await Promise.allSettled(
    Object.entries(byTenant).map(async ([tenantId, events]) => {
      for (const event of events) {
        try {
          await analyticsAPI.trackEvent(tenantId, event.eventName, { ...event.eventData, client_timestamp: event.timestamp });
        } catch (err) {
          console.error("Event tracking failed:", err);
        }
      }
    })
  );
}

function scheduleFlush() {
  if (flushTimeout) return;
  flushTimeout = setTimeout(() => {
    flushTimeout = null;
    flushEvents();
  }, FLUSH_INTERVAL);
}

export function useTracking(defaultTenantId = "default") {
  const tenantRef = useRef(defaultTenantId);
  tenantRef.current = defaultTenantId;

  useEffect(() => {
    // Flush on unmount
    return () => {
      if (eventQueue.length > 0) flushEvents();
    };
  }, []);

  const trackEvent = useCallback((eventName: string, eventData: Record<string, any> = {}, options: { immediate?: boolean; tenantId?: string } = {}) => {
    const { immediate = false, tenantId = tenantRef.current } = options;
    
    if (immediate) {
      analyticsAPI.trackEvent(tenantId, eventName, eventData).catch(console.error);
      return;
    }

    eventQueue.push({ tenantId, eventName, eventData, timestamp: Date.now() });
    
    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    } else {
      scheduleFlush();
    }
  }, []);

  const trackPageView = useCallback((pageName: string, meta: Record<string, any> = {}) => {
    trackEvent("page_view", { page: pageName, url: typeof window !== "undefined" ? window.location.href : "", ...meta });
  }, [trackEvent]);

  const trackClick = useCallback((elementId: string, meta: Record<string, any> = {}) => {
    trackEvent("click", { element: elementId, ...meta });
  }, [trackEvent]);

  const trackConversion = useCallback((type: string, value: number, meta: Record<string, any> = {}) => {
    trackEvent("conversion", { type, value, ...meta }, { immediate: true });
  }, [trackEvent]);

  const trackCampaign = useCallback((campaignId: string, action: string, meta: Record<string, any> = {}) => {
    trackEvent("campaign_interaction", { campaign_id: campaignId, action, ...meta });
  }, [trackEvent]);

  return { trackEvent, trackPageView, trackClick, trackConversion, trackCampaign, flush: flushEvents };
}

export default useTracking;