// event-bus.ts
// A simple Pub/Sub event bus to decouple modules.

const eventTarget = document.body;

type EventCallback = (event: CustomEvent) => void;

export const eventBus = {
  /**
   * Subscribes to an event.
   * @param event The event name.
   * @param callback The function to call when the event is emitted.
   */
  on(event: string, callback: EventCallback) {
    eventTarget.addEventListener(event, callback as EventListener);
  },

  /**
   * Unsubscribes from an event.
   * @param event The event name.
   * @param callback The callback function to remove.
   */
  off(event: string, callback: EventCallback) {
    eventTarget.removeEventListener(event, callback as EventListener);
  },

  /**
   * Emits an event.
   * @param event The event name.
   * @param data Optional data to pass with the event.
   */
  emit(event: string, data?: any) {
    eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
};
