import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { City } from '../domain/city/City';

@Injectable({
  providedIn: 'root',
})
export class CityApiService {
  /* private apiUrl = 'https://geo.api.gouv.fr/communes'; */
  private http = inject(HttpClient);

  public searchCity(query: string): Observable<City[]> {
    return this.http
      .get<City[]>(`/api/cities/search?nom=${query}`, {
        withCredentials: true,
      })
      .pipe(
        map((response) => {
          return response.map((city) => {
            return {
              id: city.id,
              name: city.name,
              zip: city.zip,
            };
          });
        })
      );
  }

  /* public searchCities(query: string) {
    const params = new URLSearchParams({
      nom: query,
      fields: 'nom,code,codesPostaux',
      boost: 'population',
      limit: '10',
    });

    return fetch(`${this.apiUrl}?${params.toString()}`).then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    });
  } */
}
