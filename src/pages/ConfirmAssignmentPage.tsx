
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface AssignmentDetails {
  id: string;
  eventName: string;
  staffName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
}

const ConfirmAssignmentPage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDetails | null>(null);
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'declined' | 'error' | 'expired'>('pending');
  const [error, setError] = useState<string>('');

  const handleConfirmation = async (action: 'confirm' | 'decline') => {
    if (!token) return;

    setLoading(true);
    try {
      console.log(`Processing ${action} for token:`, token);

      const { data, error } = await supabase.functions.invoke('handle-confirmation', {
        body: {
          token,
          action,
          userAgent: navigator.userAgent,
          ipAddress: 'client-side' // You could implement IP detection if needed
        }
      });

      if (error) {
        console.error(`Error ${action}ing assignment:`, error);
        setError(error.message);
        setStatus('error');
        toast({
          title: "Error",
          description: `Failed to ${action} assignment: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      console.log(`${action} successful:`, data);

      if (data.success) {
        setStatus(action === 'confirm' ? 'confirmed' : 'declined');
        setAssignment(data.assignment);
        toast({
          title: "Success",
          description: `Assignment ${action}ed successfully!`,
        });
      } else if (data.status === 'already_confirmed') {
        setStatus('confirmed');
        toast({
          title: "Already Confirmed",
          description: "This assignment has already been confirmed.",
        });
      } else if (data.status === 'already_declined') {
        setStatus('declined');
        toast({
          title: "Already Declined",
          description: "This assignment has already been declined.",
        });
      }
    } catch (error: any) {
      console.error(`Error ${action}ing assignment:`, error);
      setError(error.message);
      setStatus('error');
      toast({
        title: "Error",
        description: `Failed to ${action} assignment. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Invalid Link
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>This confirmation link is invalid or malformed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'pending' && "Event Assignment Confirmation"}
            {status === 'confirmed' && (
              <span className="text-green-600 flex items-center justify-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Assignment Confirmed
              </span>
            )}
            {status === 'declined' && (
              <span className="text-red-600 flex items-center justify-center gap-2">
                <XCircle className="h-5 w-5" />
                Assignment Declined
              </span>
            )}
            {status === 'error' && (
              <span className="text-red-600 flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Error
              </span>
            )}
            {status === 'expired' && (
              <span className="text-orange-600 flex items-center justify-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Link Expired
              </span>
            )}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'pending' && "Please confirm or decline your assignment to this event"}
            {status === 'confirmed' && "Thank you for confirming your assignment!"}
            {status === 'declined' && "Your assignment has been declined."}
            {status === 'error' && "There was an error processing your request."}
            {status === 'expired' && "This confirmation link has expired."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {assignment && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg">{assignment.eventName}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span><strong>Assigned to:</strong> {assignment.staffName}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span><strong>Date:</strong> {formatDate(assignment.eventDate)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span><strong>Time:</strong> {assignment.startTime} - {assignment.endTime}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span><strong>Location:</strong> {assignment.location}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {status === 'pending' && (
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => handleConfirmation('confirm')}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Processing..." : "Confirm Assignment"}
              </Button>
              
              <Button
                onClick={() => handleConfirmation('decline')}
                disabled={loading}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {loading ? "Processing..." : "Decline Assignment"}
              </Button>
            </div>
          )}

          {(status === 'confirmed' || status === 'declined') && assignment && (
            <div className="text-center">
              <p className="text-gray-600">
                {status === 'confirmed' 
                  ? "You can now add this event to your calendar." 
                  : "The event organizer has been notified of your decision."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConfirmAssignmentPage;
