import { Controller, Get, Query, BadRequestException, ParseFloatPipe, ParseIntPipe } from '@nestjs/common';
import { WeatherService } from './weather.service';

@Controller('weather-risk')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  async getWeatherRisk(
    @Query('lat', ParseFloatPipe) lat: number,
    @Query('lon', ParseFloatPipe) lon: number,
    @Query('dayOfYear', ParseIntPipe) dayOfYear: number,
    @Query('tempThreshold') tempThreshold?: string,
    @Query('rainThreshold') rainThreshold?: string,
    @Query('windThreshold') windThreshold?: string,
  ) {
    // NestJS pipes handle the primary parsing and validation.
    // We now handle the optional parameters with defaults.
    const params = {
      lat,
      lon,
      dayOfYear,
      tempThreshold: tempThreshold ? parseFloat(tempThreshold) : 35,
      rainThreshold: rainThreshold ? parseFloat(rainThreshold) : 5,
      windThreshold: windThreshold ? parseFloat(windThreshold) : 25,
    };
    
    return this.weatherService.getWeatherRiskAnalysis(params);
  }
}