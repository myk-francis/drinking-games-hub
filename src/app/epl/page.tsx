"use client";
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Send, Target, Calendar, Clock } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
import { redirect } from "next/navigation";

const EPLPredictorUI = () => {
  const trpc = useTRPC();
  const { data: currentUser, isLoading: userLoading } = useQuery(
    trpc.auth.getCurrentUser.queryOptions()
  );

  useEffect(() => {
    if (!userLoading) {
      if (
        currentUser === null ||
        currentUser === undefined ||
        currentUser.username !== "myk"
      ) {
        redirect("/login");
      }
    }
  }, [currentUser, userLoading]);

  const teams = [
    "West Ham",
    "Everton",
    "Fulham",
    "West Brom",
    "Birmingham",
    "Man City",
    "Blackpool",
    "Stoke",
    "Arsenal",
    "Newcastle",
    "Blackburn",
    "Wolves",
    "Tottenham",
    "Sunderland",
    "Bolton",
    "Chelsea",
    "Man United",
    "Aston Villa",
    "Liverpool",
    "Wigan",
    "Norwich",
    "Swansea",
    "QPR",
    "Southampton",
    "Reading",
    "Cardiff",
    "Hull",
    "Crystal Palace",
    "Leicester",
    "Burnley",
    "Watford",
    "Bournemouth",
    "Middlesbrough",
    "Huddersfield",
    "Brighton",
    "Sheffield United",
  ];

  // Predict section state
  const [predictHomeTeam, setPredictHomeTeam] = useState("");
  const [predictAwayTeam, setPredictAwayTeam] = useState("");
  const [predictMatches, setPredictMatches] = useState<[string, string][]>([]);

  // Train section state
  const [trainHomeTeam, setTrainHomeTeam] = useState("");
  const [trainAwayTeam, setTrainAwayTeam] = useState("");
  const [totalGoals, setTotalGoals] = useState("");
  const [trainingData, setTrainingData] = useState([]);

  // Results state
  const [predictionResults, setPredictionResults] = useState([]);
  const [trainingResults, setTrainingResults] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTrainingLoading, setTrainingIsLoading] = useState(false);

  // Add match for prediction
  const addPredictMatch = () => {
    if (
      predictHomeTeam &&
      predictAwayTeam &&
      predictHomeTeam !== predictAwayTeam
    ) {
      setPredictMatches([
        ...predictMatches,
        [predictHomeTeam, predictAwayTeam],
      ]);
      setPredictHomeTeam("");
      setPredictAwayTeam("");
    }
  };

  // Remove match from prediction list
  const removePredictMatch = (index: number) => {
    setPredictMatches(predictMatches.filter((_, i) => i !== index));
  };

  // Add training data
  const addTrainingData = () => {
    if (
      trainHomeTeam &&
      trainAwayTeam &&
      totalGoals &&
      trainHomeTeam !== trainAwayTeam
    ) {
      const currentDate = new Date();
      const newData = {
        HomeTeam: trainHomeTeam,
        AwayTeam: trainAwayTeam,
        Month: currentDate.getMonth() + 1,
        Weekday: currentDate.getDay(),
        TotalGoals: parseInt(totalGoals),
      };
      //@ts-expect-error // Ignore type error for simplicity
      setTrainingData([...trainingData, newData]);
      setTrainHomeTeam("");
      setTrainAwayTeam("");
      setTotalGoals("");
    }
  };

  // Remove training data

  const removeTrainingData = (index: number) => {
    setTrainingData(trainingData.filter((_, i) => i !== index));
  };

  // Send predict request
  const sendPredictRequest = async () => {
    if (predictMatches.length === 0) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        "https://ml-epl-stats-predictor-production.up.railway.app/predict/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(predictMatches),
        }
      );
      const result = await response.json();
      setPredictionResults(result);
      // console.log("Prediction result:", result);
    } catch (error) {
      console.error("Error:", error);
      // You can add error state here if needed
    } finally {
      setIsLoading(false);
    }
  };

  // Send training request
  const sendTrainingRequest = async () => {
    if (trainingData.length === 0) return;

    setTrainingIsLoading(true);
    try {
      const response = await fetch(
        "https://ml-epl-stats-predictor-production.up.railway.app/train-new/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(trainingData),
        }
      );
      const result = await response.json();

      setTrainingResults("Training result:" + String(result.accuracy));
      // Handle response here
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setTrainingIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            EPL Stats Predictor
          </h1>
          <p className="text-lg text-gray-600">
            Predict match outcomes and train your model
          </p>
        </div>

        {/* Results Section */}
        {predictionResults?.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Prediction Results
              </CardTitle>
              <CardDescription className="text-green-100">
                AI predictions for your selected matches
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4">
                {predictionResults.map(
                  (result: { [key: string]: string }, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200 hover:shadow-md transition-shadow "
                    >
                      <div className="flex-col  items-center justify-between mb-3 ">
                        <div className="flex items-center space-x-3 ">
                          <div className="text-lg font-bold text-gray-800">
                            {result?.HomeTeam}
                          </div>
                          <div className="text-gray-400 text-sm font-medium">
                            vs
                          </div>
                          <div className="text-lg font-bold text-gray-800">
                            {result?.AwayTeam}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                          >
                            <Calendar className="h-3 w-3 mr-1" />
                            {result?.Year}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-200"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Month {result?.Month}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Weekday:
                          </span>
                          <Badge variant="secondary">
                            {
                              [
                                "Sunday",
                                "Monday",
                                "Tuesday",
                                "Wednesday",
                                "Thursday",
                                "Friday",
                                "Saturday",
                              ][parseInt(result?.Weekday) || 0]
                            }
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-600" />
                          <div
                            className={`px-3 py-1 rounded-full font-medium text-sm ${
                              result?.Prediction === "2 or more goals"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : "bg-orange-100 text-orange-800 border border-orange-200"
                            }`}
                          >
                            {result?.Prediction}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Clear Results Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setPredictionResults([])}
                  className="w-full text-gray-600 hover:text-gray-800"
                >
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Predict Section */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Match Predictions
              </CardTitle>
              <CardDescription className="text-blue-100">
                Add matches to predict outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Team selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="predict-home">Home Team</Label>
                    <Select
                      value={predictHomeTeam}
                      onValueChange={setPredictHomeTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team}
                            value={team}
                            disabled={team === predictAwayTeam}
                          >
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="predict-away">Away Team</Label>
                    <Select
                      value={predictAwayTeam}
                      onValueChange={setPredictAwayTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team}
                            value={team}
                            disabled={team === predictHomeTeam}
                          >
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={addPredictMatch}
                  disabled={
                    !predictHomeTeam ||
                    !predictAwayTeam ||
                    predictHomeTeam === predictAwayTeam
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Match
                </Button>

                {/* Match list */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {predictMatches.map((match, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">
                        {match[0]} <span className="text-gray-500">vs</span>{" "}
                        {match[1]}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePredictMatch(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={sendPredictRequest}
                  disabled={predictMatches.length === 0 || isLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      Send Prediction Request ({predictMatches.length} matches)
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Train Section */}
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Training Data
              </CardTitle>
              <CardDescription className="text-purple-100">
                Add new training data for your model
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Team selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="train-home">Home Team</Label>
                    <Select
                      value={trainHomeTeam}
                      onValueChange={setTrainHomeTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Home team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team}
                            value={team}
                            disabled={team === trainAwayTeam}
                          >
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="train-away">Away Team</Label>
                    <Select
                      value={trainAwayTeam}
                      onValueChange={setTrainAwayTeam}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Away team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem
                            key={team}
                            value={team}
                            disabled={team === trainHomeTeam}
                          >
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total-goals">Total Goals</Label>
                  <Input
                    id="total-goals"
                    type="number"
                    min="0"
                    value={totalGoals}
                    onChange={(e) => setTotalGoals(e.target.value)}
                    placeholder="Enter total goals scored"
                  />
                </div>

                <Button
                  onClick={addTrainingData}
                  disabled={
                    !trainHomeTeam ||
                    !trainAwayTeam ||
                    !totalGoals ||
                    trainHomeTeam === trainAwayTeam
                  }
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Training Data
                </Button>

                {/* Training data list */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {trainingData.map(
                    (data: { [key: string]: string }, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {data.HomeTeam}{" "}
                            <span className="text-gray-500">vs</span>{" "}
                            {data.AwayTeam}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrainingData(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="secondary">
                            Goals: {data.TotalGoals}
                          </Badge>
                          <Badge variant="secondary">Month: {data.Month}</Badge>
                          <Badge variant="secondary">
                            Weekday: {data.Weekday}
                          </Badge>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <Button
                  onClick={sendTrainingRequest}
                  disabled={trainingData.length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isTrainingLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>Send Training Request ({trainingData.length} entries)</>
                  )}
                </Button>

                <p className="mt-4 text-green-700 text-lg">{trainingResults}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview JSON */}
        {(predictMatches.length > 0 || trainingData.length > 0) && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                Preview of the data that will be sent to your API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {predictMatches.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Prediction Data:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(predictMatches, null, 2)}
                    </pre>
                  </div>
                )}
                {trainingData.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Training Data:</h4>
                    <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                      {JSON.stringify(trainingData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EPLPredictorUI;
