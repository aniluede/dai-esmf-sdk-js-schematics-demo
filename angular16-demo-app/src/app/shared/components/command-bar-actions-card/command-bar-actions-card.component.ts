/*
 * Copyright (c) 2023 Robert Bosch Manufacturing Solutions GmbH
 *
 * See the AUTHORS file(s) distributed with this work for
 * additional information regarding authorship.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

/** Generated from ESMF JS SDK Angular Schematics - PLEASE DO NOT CHANGE IT **/
import {
  AfterViewInit,
  Component,
  ContentChild,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';

import {Movement} from '../../types/movement/movement.types';

import {CommandBarActionsCardFilterService, SortCard} from './command-bar-actions-card-filter.service';

import {MatDialog} from '@angular/material/dialog';
import {unparse} from 'papaparse';
import {filter} from 'rxjs/operators';
import {Action, ExportCardDialogComponent} from '../export-confirmation-dialog/export-card-dialog.component';

import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';

import {CommandBarActionsCardService} from './command-bar-actions-card.service';

export enum CommandBarActionsCardCardValues {
  IS_MOVING = 'isMoving',
  SPEED = 'speed',
  SPEED_LIMIT_WARNING = 'speedLimitWarning',
}

@Component({
  selector: 'esmf-ui-command-bar-actions-card',
  templateUrl: './command-bar-actions-card.component.html',
  styleUrls: ['./command-bar-actions-card.component.scss'],

  encapsulation: ViewEncapsulation.None,
})
export class CommandBarActionsCardComponent implements OnInit, AfterViewInit {
  @ContentChild('cardTemplate') cardTemplate!: TemplateRef<any>;

  @Input() data: Array<Movement> = [];

  @Input() minNumberCharacters: number = 2;
  @Input() maxNumberCharacters: number = 50;

  @Input() maxExportRows: number = 0;

  @Output() cardUpdateStartEvent = new EventEmitter<any>();
  @Output() cardUpdateFinishedEvent = new EventEmitter<any>();

  @Output() downloadEvent = new EventEmitter<{error: boolean; success: boolean; inProgress: boolean}>();

  @Output() detail = new EventEmitter<any>();

  @ViewChild('searchInput') searchInput!: ElementRef;

  @ViewChild(MatPaginator, {static: true}) paginator!: MatPaginator;

  currentLanguage: string;

  dataSource: MatTableDataSource<Movement> = new MatTableDataSource<Movement>();

  dataToShow: Array<Movement> = [];
  totalItems: number = 0;
  dataLoadError = false;

  commandBarActionsCardCardValues = Object.values(CommandBarActionsCardCardValues);

  constructor(
    private translateService: TranslateService,
    private commandBarActionsCardService: CommandBarActionsCardService,
    private filterService: CommandBarActionsCardFilterService,

    public dialog: MatDialog
  ) {
    this.currentLanguage = this.translateService.currentLang;
  }

  getContext(data: Movement) {
    return {
      commandBarActionsCardCardValues: this.commandBarActionsCardCardValues,
      $implicit: data,
      getElementValue: this.getElementValue.bind(this),
      translateService: this.translateService,
    };
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.defaultSorting();

    this.dataToShow = [...this.data];
    this.totalItems = this.dataToShow.length;
    this.dataSource.data = this.dataToShow;
    this.dataSource.paginator = this.paginator;
    this.paginator.length = this.dataToShow.length;
  }

  private defaultSorting() {
    this.filterService.sortedProperty = 'speedLimitWarning';

    this.sorting();
  }

  reloadFilter(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    this.cardUpdateStartEvent.emit();

    this.dataToShow = this.applyAllFilters(this.data);
    this.totalItems = this.dataToShow.length;
    this.maxExportRows = this.totalItems;

    this.cardUpdateFinishedEvent.emit();
  }

  private applyAllFilters(data: any[]): any[] {
    let dataTemp = [...data];

    return dataTemp;
  }

  sorting() {
    this.data.sort((a, b) => {
      let aValue = (a as any)[this.filterService.sortedProperty];
      let bValue = (b as any)[this.filterService.sortedProperty];

      if (typeof aValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }

      if (Date.parse(aValue)) {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (this.filterService.sortCard === SortCard.ASCENDING) {
        if (aValue < bValue) return -1;
        if (aValue > bValue) return 1;

        return 0;
      } else {
        if (aValue < bValue) return 1;
        if (aValue > bValue) return -1;

        return 0;
      }
    });

    this.applyFilters();
  }

  openExportConfirmationDialog() {
    const dialogRef = this.dialog
      .open(ExportCardDialogComponent, {
        data: {maxExportRows: this.maxExportRows},
        maxWidth: 478,
      })
      .afterClosed()
      .pipe(filter(e => !!e))
      .subscribe((event: {action: Action; exportFirstPage: boolean}) => {
        if (event.action === Action.cancel) {
          return;
        }

        const exportData = JSON.parse(JSON.stringify(this.data));

        if (event.exportFirstPage && exportData.length > this.paginator.pageSize) {
          exportData.length = this.paginator.pageSize;
        }

        if (!event.exportFirstPage && this.data.length > this.maxExportRows) {
          exportData.length = this.maxExportRows;
        }

        this.exportToCsv(exportData);
      });
  }

  private exportToCsv(exportData: Array<Movement>) {
    const headersCSV = unparse({
      fields: this.commandBarActionsCardCardValues.map(columnName => {
        const translatedHeader = this.translateService.instant(`movement.${columnName}.preferredName`);
        return translatedHeader !== `movement.${columnName}.preferredName` ? translatedHeader : columnName;
      }),
      data: [],
    });

    this.downloadCsv(`${headersCSV}${unparse(exportData, {header: false, columns: this.commandBarActionsCardCardValues})}`);
  }

  private downloadCsv(csvArray: string) {
    this.downloadEvent.emit({error: false, success: false, inProgress: true});
    try {
      this.commandBarActionsCardService.downloadCsv(csvArray);

      this.downloadEvent.emit({error: false, success: true, inProgress: false});
    } catch (error: any) {
      this.downloadEvent.emit({error: true, success: false, inProgress: false});
    }
  }

  detailInformation(data: Movement) {
    this.detail.emit(data);
  }

  getElementValue(data: any, element: string) {
    const properties = element.split('.');

    return properties.reduce((currentValue, property) => {
      if (currentValue && currentValue.hasOwnProperty(property)) {
        return currentValue[property];
      } else {
        return undefined;
      }
    }, data);
  }
}
