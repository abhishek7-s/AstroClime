import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as ss from 'simple-statistics';

// This defines the structure of the data we expect
export interface WeatherRiskParams {
  lat: number;
  lon: number;
  dayOfYear: number;
  tempThreshold: number;
  rainThreshold: number;
  windThreshold: number;
}

@Injectable()
export class WeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeatherRiskAnalysis(params: WeatherRiskParams) {
    const { lat, lon, dayOfYear, tempThreshold, rainThreshold, windThreshold } = params;
    const START_YEAR = 1990;
    const END_YEAR = 2023; // Use recent, complete data

    // 1. Construct the URL and fetch data from the NASA POWER API
    const apiUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M_MAX,PRECTOTCORR,WS10M_MAX&community=RE&longitude=${lon}&latitude=${lat}&start=${START_YEAR}&end=${END_YEAR}&format=JSON`;
    
    let nasaData;
    try {
      const response = await firstValueFrom(this.httpService.get(apiUrl));
      nasaData = response.data;
    } catch (error) {
      console.error('Error fetching from NASA POWER API:', error.message);
      throw new InternalServerErrorException('Failed to fetch data from NASA POWER API.');
    }

    // 2. Process the raw data
    const properties = nasaData.properties.parameter;
    const dates = Object.keys(properties.T2M_MAX);

    // Filter for the specific day of the year across all years
    const targetDayData = dates
      .map(dateStr => {
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));
        const currentDate = new Date(Date.UTC(year, month - 1, day));
        const startOfYear = new Date(Date.UTC(year, 0, 0));
        const diff = currentDate.getTime() - startOfYear.getTime();
        const currentDayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (currentDayOfYear === dayOfYear) {
          return {
            year,
            temp: properties.T2M_MAX[dateStr],
            rain: properties.PRECTOTCORR[dateStr],
            wind: properties.WS10M_MAX[dateStr] * 3.6, // Convert meters/sec to km/h
          };
        }
        return null;
      })
      // **FIX:** We combine the null check and the data validation into one filter.
      .filter(d => d && d.temp > -99 && d.rain > -99 && d.wind > -99); 
      
    if (targetDayData.length < 5) {
        throw new InternalServerErrorException('Not enough historical data for a reliable analysis.');
    }

    // 3. Perform the analysis for each metric
    const tempAnalysis = this.analyzeMetric(
      targetDayData,
      'temp',
      tempThreshold,
    );
    const rainAnalysis = this.analyzeMetric(
      targetDayData,
      'rain',
      rainThreshold,
    );
    const windAnalysis = this.analyzeMetric(
      targetDayData,
      'wind',
      windThreshold,
    );

    // 4. Calculate the overall "DayScore"
    const overallScore = ((tempAnalysis.probability + rainAnalysis.probability + windAnalysis.probability) / 300) * 10;
    
    // 5. Return the final structured response
    return {
      overallRiskScore: overallScore,
      temperature: tempAnalysis,
      precipitation: rainAnalysis,
      wind: windAnalysis,
      rawDataUrl: apiUrl,
    };
  }

  private analyzeMetric(data: any[], key: string, threshold: number) {
    const eventsOverThreshold = data.filter(d => d[key] > threshold).length;
    const probability = (eventsOverThreshold / data.length) * 100;

    // Trend analysis using linear regression
    const timeSeries = data.map(d => [d.year, d[key]]);
    const regression = ss.linearRegression(timeSeries);
    const slope = regression.m;
    let trend = 'Stable';
    if (slope > 0.05) trend = 'Increasing';
    if (slope < -0.05) trend = 'Decreasing';


    const history = {
        labels: data.map(d => d.year),
        data: data.map(d => d[key]),
    };

    return { probability, trend, history };
  }
}