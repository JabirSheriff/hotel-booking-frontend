// src/app/services/search.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private searchParamsSubject = new BehaviorSubject<any>(null);
  searchParams$ = this.searchParamsSubject.asObservable();

  setSearchParams(params: any) {
    this.searchParamsSubject.next(params);
  }

  getSearchParams() {
    return this.searchParamsSubject.value;
  }
}