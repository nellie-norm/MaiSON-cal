"use client";

import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import SimpleCalendar from './SimpleCalendar';

interface EventDetails {
  title: string;
  date: string;
  time: string;
}

interface GoogleEvent {
  id: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

const GoogleCalendarWrapper = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [events, setEvents] = useState<GoogleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      await fetchEvents(tokenResponse.access_token);
    },
    onError: (errorResponse) => {
      setError('Failed to login with Google');
      console.error('Google Login Error:', errorResponse);
    },
    scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
  });

  const fetchEvents = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const timeMin = new Date();
      timeMin.setMonth(timeMin.getMonth() - 1);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.items || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch calendar events');
    } finally {
      setIsLoading(false);
    }
  };

  const addEventToGoogle = async (eventDetails: EventDetails) => {
    if (!accessToken) {
      console.log('No access token available');
      return false;
    }
  
    setIsLoading(true);
    setError(null);
  
    const event = {
      summary: eventDetails.title,
      start: {
        dateTime: `${eventDetails.date}T${eventDetails.time}:00`,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        // Add one hour to the end time
        dateTime: new Date(new Date(`${eventDetails.date}T${eventDetails.time}:00`).getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  
    console.log('Attempting to create event:', event);
  
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(event),
        }
      );
  
      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);
  
      if (!response.ok) {
        throw new Error(`Failed to create event: ${responseData.error?.message || 'Unknown error'}`);
      }
  
      setEvents(prevEvents => [...prevEvents, responseData]);
      return true;
    } catch (error) {
      console.error('Detailed error:', error);
      setError('Failed to create event');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      {!accessToken ? (
        <button
          onClick={() => login()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign in with Google Calendar'}
        </button>
      ) : (
        <>
          {isLoading && (
            <div className="text-gray-600">Loading...</div>
          )}
          <SimpleCalendar 
            events={events}
            onAddEvent={addEventToGoogle}
            isLoading={isLoading}
          />
        </>
      )}
    </div>
  );
};

const GoogleCalendar = () => {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>
      <GoogleCalendarWrapper />
    </GoogleOAuthProvider>
  );
};

export default GoogleCalendar;