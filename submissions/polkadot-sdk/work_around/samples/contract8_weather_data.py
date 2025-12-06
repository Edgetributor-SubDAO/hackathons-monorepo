"""
Smart Contract 8: Weather Data Processor
Store and process weather data from external API (via oracle)
"""

def update_temperature(current_temp, new_temp):
    """
    Update temperature from weather API
    Returns new temperature value
    """
    return current_temp + (new_temp - current_temp)

def calculate_temperature_change(old_temp, new_temp):
    """
    Calculate temperature change/delta
    Returns the difference
    """
    return new_temp - old_temp

def process_wind_speed(base_speed, wind_change):
    """
    Process wind speed data from API
    Returns updated wind speed
    """
    return base_speed + wind_change

def calculate_weather_index(temperature, wind_speed):
    """
    Calculate a weather comfort index
    Returns combined weather index
    """
    return temperature * wind_speed

def main():
    print("Weather Data Contract")
    print("Stores weather data from Open-Meteo API")
    print("Data is fed by oracle service (off-chain)")

if __name__ == "__main__":
    main()

