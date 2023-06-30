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
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort, SortDirection} from '@angular/material/sort';
import {MatTable} from '@angular/material/table';

import {Clipboard} from '@angular/cdk/clipboard';
import {MatDialog} from '@angular/material/dialog';
import {unparse} from 'papaparse';
import {Movement} from '../../types/movement/movement.types';
import {ExportConfirmationDialog} from '../export-confirmation-dialog/export-confirmation-dialog.component';
import {RemoteDataDataSource} from './remote-data-datasource';

import {SelectionModel} from '@angular/cdk/collections';
import {DomSanitizer} from '@angular/platform-browser';
import {TranslateService} from '@ngx-translate/core';
import {JSSdkLocalStorageService} from '../../services/storage.service';
import {RemoteDataColumnMenuComponent} from './remote-data-column-menu.component';

import {AbstractArrayNode, AbstractNode, And, Eq, Limit, Query, QueryStringifier, Sort} from 'rollun-ts-rql';
import {Subject} from 'rxjs';
import {filter} from 'rxjs/operators';
import {CustomRemoteDataService} from './custom-remote-data.service';
import {MovementResponse} from './remote-data.service';

/**
 * Interface of a CustomRQLFilterExtension which will be used to
 * modify the RQL query before the API service will be called to query
 * the backend.
 */
export interface CustomRQLFilterExtension {
  /**
   * Apply modification to the given RQL query
   */
  apply(query: And): void;
}

/**
 * Interface of a CustomRQLOptionExtension which will be used to
 * modify the RQL query before the API service will be called to query
 * the backend.
 */
export interface CustomRQLOptionExtension {
  /**
   * Apply modification to the given RQL query
   */
  apply(query: Query): void;
}

/**
 * Interface of ExtendedCsvExporter which will used to export data
 * from a remote backend.
 */
export interface ExtendedCsvExporter {
  /**
   * Exports the all data
   */
  export(displayedColumns: string[], rqlQuery: string): void;
}

export interface Column {
  /** Column name **/
  name: string;
  /** State if the column is selected **/
  selected: boolean;
}

/**
 * Enumeration of all available columns which can be shown/hide in the table.
 */
export enum RemoteDataColumn {
  MOVING = 'moving',
  SPEED_LIMIT_WARNING = 'speedLimitWarning',
  START_DATE = 'startDate',
  END_DATE = 'endDate',

  COLUMNS_MENU = 'columnsMenu',
}

@Component({
  selector: 'esmf-ui-remote-data',
  templateUrl: './remote-data.component.html',
  styleUrls: ['./remote-data.component.scss'],

  encapsulation: ViewEncapsulation.None,
})
export class RemoteDataComponent implements OnInit, AfterViewInit, AfterViewChecked, OnDestroy {
  @Input() tableDateTimeFormat = 'short';

  @Input() data: Array<Movement> = [];
  @Input() customTemplate?: TemplateRef<any>;
  @Input() searchHint?: string;
  @Input() showFirstLastButtons: boolean = true;

  @Input() pageSize: number = 20;
  @Input() pageSizeOptions: Array<number> = [5, 20, 50, 100];

  @Input() highlightSelectedRow: boolean = true;
  @Input() highlightColor = 'rgba(127, 198, 231, 0.3)';
  @Input() isMultipleSelectionEnabled = true;
  @Input() noDataMessage: string = '';
  @Input() visibleRowActionsIcons: number = 3;
  @Input() headerTooltipsOff: boolean = false;
  @Input() setStickRowActions: boolean = true;
  @Input() customTableClass: string = '';
  @Input() debounceTime: number = 500;
  @Input() minNumberCharacters: number = 2;
  @Input() maxNumberCharacters: number = 50;
  @Input() allowedCharacters: string = '';
  @Input() regexValidator: string = '';

  @Input() maxExportRows: number = 5000;
  @Input() customFilterExtension: CustomRQLFilterExtension | undefined;
  @Input() customOptionsExtension: CustomRQLOptionExtension | undefined;
  @Input() extendedCsvExporter: ExtendedCsvExporter | undefined;
  @Input() remoteAPI: string = '';

  @Output() rowClickEvent = new EventEmitter<any>();
  @Output() rowDblClickEvent = new EventEmitter<any>();
  @Output() rowRightClickEvent = new EventEmitter<any>();
  @Output() tableUpdateStartEvent = new EventEmitter<any>();
  @Output() tableUpdateFinishedEvent = new EventEmitter<any>();
  @Output() copyToClipboardEvent = new EventEmitter<any>();
  @Output() downloadEvent = new EventEmitter<{error: boolean; success: boolean; inProgress: boolean}>();
  @Output() rowSelectionEvent = new EventEmitter<any>();

  @ViewChild(MatSort) private sort!: MatSort;
  @ViewChild(MatPaginator) private paginator!: MatPaginator;
  @ViewChild(MatTable) private table!: MatTable<Movement>;
  @ViewChild(RemoteDataColumnMenuComponent) private columMenuComponent!: RemoteDataColumnMenuComponent;

  @ViewChild('searchInput') searchInput!: ElementRef;

  @HostBinding('attr.style')
  public get valueAsStyle(): any {
    if (!this.highlightColor) {
      return;
    }
    return this.sanitizer.bypassSecurityTrustStyle(`--selected-row-highlight-color: ${this.highlightColor}`);
  }

  readonly KEY_LOCAL_STORAGE_REMOTE_DATA_COLUMNS = 'remote_data_columns';

  totalItems: number = 0;
  selection = new SelectionModel<any>(this.isMultipleSelectionEnabled, []);
  dataSource: RemoteDataDataSource;
  columnToSort: {sortColumnName: string; sortDirection: SortDirection} = {sortColumnName: 'endDate', sortDirection: 'asc'};
  displayedColumns: Array<string> = Object.values(RemoteDataColumn);
  columns: Array<Column> = [];

  currentLanguage: string;
  filteredData: Array<Movement> = [];
  dragging: boolean = false;
  customRowActionsLength: number = 0;
  closeColumnMenu: boolean = false;
  rqlString: string = '';
  searchFocused: boolean = false;

  private readonly ngUnsubscribe = new Subject<void>();

  constructor(
    private sanitizer: DomSanitizer,
    private translateService: TranslateService,
    public dialog: MatDialog,
    private clipboard: Clipboard,
    private storageService: JSSdkLocalStorageService,

    private customremoteDataService: CustomRemoteDataService,
    private cd: ChangeDetectorRef
  ) {
    this.dataSource = new RemoteDataDataSource();

    this.currentLanguage = this.translateService.currentLang;
  }

  ngOnInit(): void {
    this.initializeColumns();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
  ngAfterViewInit(): void {
    this.applyFilters();
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.pageChange();
  }
  ngAfterViewChecked(): void {
    if (this.table) {
      this.table.updateStickyColumnStyles();
    }
  }

  initializeColumns(): void {
    const columnStorage = this.storageService.getItem(this.KEY_LOCAL_STORAGE_REMOTE_DATA_COLUMNS);

    if (columnStorage?.length > 0) {
      columnStorage
        .filter((column: Column) => this.displayedColumns.find(columnName => columnName === column.name))
        .forEach((column: Column) => this.columns.push({name: column.name, selected: column.selected}));
    }

    this.displayedColumns.forEach((displayedColumn: string): void => {
      if (displayedColumn === RemoteDataColumn['COLUMNS_MENU'] || this.columns.find(column => column.name === displayedColumn)) {
        return;
      }

      this.columns.push({name: displayedColumn, selected: true});
    });

    // if no column besides checkboxes and column actions is active, reset and show all columns
    if (!this.columns.find((column: Column) => column.selected)) {
      this.columns.forEach((column: Column) => (column.selected = true));
    }

    this.setDisplayedColumns(this.columns);
  }

  hideColumn(column: RemoteDataColumn): void {
    this.displayedColumns = this.displayedColumns.filter(columnName => columnName !== column);
  }

  showColumn(column: RemoteDataColumn, index: number): void {
    if (!this.displayedColumns.includes(column)) {
      this.displayedColumns.splice(index, 0, column);
    }
  }

  resetDisplayedColumns(): void {
    this.displayedColumns = Object.values(RemoteDataColumn);
  }

  pageChange(): void {
    this.applyFilters();
  }

  sortData(): void {
    this.applyFilters();
  }

  trackBy(index: number): number {
    return index;
  }

  rowClicked(row: any, $event: MouseEvent): boolean {
    if (this.highlightSelectedRow) {
      this.checkboxClicked(row);
    }
    if ($event.type === 'contextmenu') {
      $event.preventDefault();
      let mousePositionOnClick = {x: $event.clientX + 'px', y: $event.clientY + 'px'};
      this.rowRightClickEvent.emit({data: row, mousePosition: mousePositionOnClick});
    }
    if ($event.type === 'click') {
      this.rowClickEvent.emit({data: row});
    }
    return false;
  }

  rowDblClicked(row: any, $event: MouseEvent): void {
    this.rowDblClickEvent.emit({data: row});
  }

  copyToClipboard(value: any, event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.clipboard.copy(value);
    this.copyToClipboardEvent.emit(value);
  }

  checkboxClicked(row: any): void {
    if (!this.isMultipleSelectionEnabled) {
      this.selection.clear();
    }
    this.selection.toggle(row);
    this.rowSelectionEvent.emit(this.selection.selected);
  }

  reloadFilter(): void {
    this.paginator.firstPage();
    this.applyFilters();
  }

  applyFilters(): void {
    this.tableUpdateStartEvent.emit();

    const query = new And();

    if (this.customFilterExtension) {
      this.customFilterExtension.apply(query);
    }

    const queryFilter = new Query({query: query});

    const queryOption = new Query();
    if (this.sort.active) {
      queryOption.setSort(
        new Sort(<any>{
          [this.sort.active]: this.sort.direction === 'asc' ? 1 : -1,
        })
      );
    }

    queryOption.setLimit(new Limit(this.paginator.pageIndex * this.paginator.pageSize, this.paginator.pageSize));

    if (this.customOptionsExtension) {
      this.customOptionsExtension.apply(queryOption);
    }

    // override function to ensure to create supported RQL
    QueryStringifier['withType'] = (value: any) => {
      return typeof value === 'string' && value !== 'null()' && value !== '' ? '"' + value + '"' : value;
    };
    QueryStringifier['encodeRql'] = (value: any) => {
      return value;
    };

    const additionalCondition = new Eq('local', 'EN');
    queryFilter?.queryNode.subNodes.push(additionalCondition);

    const filterRQLQuery = queryFilter ? QueryStringifier.stringify(queryFilter) : '';
    const optionsRQLQuery = QueryStringifier.stringify(queryOption).replace(/&/g, ',');

    let rqlStringTemp = '';
    if (filterRQLQuery.length > 0) {
      rqlStringTemp = `filter=${filterRQLQuery}`;
    }
    if (optionsRQLQuery.length > 0) {
      rqlStringTemp = `${rqlStringTemp}${rqlStringTemp !== '' ? '&' : ''}option=${optionsRQLQuery}`;
    }
    if (!(QueryStringifier as any)['superParseQueryNode']) {
      (QueryStringifier as any)['superParseQueryNode'] = QueryStringifier['parseQueryNode'];
    }
    QueryStringifier['parseQueryNode'] = (node?: AbstractNode): string => {
      let result = (QueryStringifier as any)['superParseQueryNode'](node);
      if (node instanceof AbstractArrayNode) {
        const arrayNode = <AbstractArrayNode>node;
        const encodedValues = arrayNode.values.map(value => QueryStringifier['withType'](QueryStringifier['withEncoding'](value)));

        // ensure outer brackets are not used. valid query ..in(<name>, "value1", "value2", ...)..
        result = `${QueryStringifier['withEncoding'](arrayNode.name, {isField: true})}(${QueryStringifier['withEncoding'](arrayNode.field, {
          isField: true,
        })},${encodedValues.join(',')})`;
      }
      return result;
    };

    this.rqlString = rqlStringTemp;

    try {
      this.customremoteDataService.requestData(this.remoteAPI, {query: rqlStringTemp}).subscribe(
        (response: MovementResponse): void => {
          this.dataSource.setData(response.items);
          this.filteredData = response.items;
          this.totalItems = this.data.length;
          this.maxExportRows = this.totalItems;
          this.cd.detectChanges();
          this.totalItems = response.totalItems !== null && response.totalItems !== undefined ? response.totalItems : response.items.length;
          this.tableUpdateFinishedEvent.emit();
        },
        error => {
          this.tableUpdateFinishedEvent.emit(error);
        }
      );
    } catch (error) {
      this.tableUpdateFinishedEvent.emit(error);
    }
  }

  removeFilter(filterData: any): void {
    this.paginator.firstPage();

    this.applyFilters();
  }

  exportToCsv() {
    this.openExportConfirmationDialog();
  }

  openExportConfirmationDialog() {
    const reduce = this.displayedColumns.filter(col => col === 'checkboxes' || col === 'columnsMenu').length;

    const dialogRef = this.dialog.open(ExportConfirmationDialog, {
      data: {
        extendedCsvExporter: this.extendedCsvExporter,
        allColumns: this.columns.length,
        displayedColumns: this.displayedColumns.length - reduce,
        maxExportRows: this.maxExportRows,
      },
      maxWidth: 478,
    });

    dialogRef
      .afterClosed()
      .pipe(filter(e => !!e))
      .subscribe((exportEvent: {exportAllPages: boolean; exportAllColumns: boolean}): void => {
        const {exportAllPages, exportAllColumns} = exportEvent;

        if (exportAllPages && this.data.length > this.maxExportRows) {
          this.data.length = this.maxExportRows;
        }
        const columns = exportAllColumns ? this.columns.map(c => c.name) : this.displayedColumns;
        this.extendedCsvExporter?.export(columns, this.rqlString);
      });
  }

  prepareCsv(data: any, exportAllColumns: boolean, exportAllPages: boolean, currentPageSize: number): void {
    if (!exportAllPages && data.length > currentPageSize) {
      data.length = currentPageSize;
    }

    const columns = exportAllColumns ? this.columns.map(c => c.name) : this.displayedColumns;
    const headersToExport = columns.filter(columnName => columnName !== RemoteDataColumn.COLUMNS_MENU);

    const headersCSV = unparse({
      fields: headersToExport.map(columnName => {
        const translatedHeader = this.translateService.instant(`${columnName}.preferredName`);
        return translatedHeader !== `${columnName}.preferredName` ? translatedHeader : columnName;
      }),
      data: [],
    });

    this.downloadCsv(`${headersCSV}${unparse(data, {header: false, columns: headersToExport})}`);
  }

  downloadCsv(csvArray: any): void {
    this.downloadEvent.emit({error: false, success: false, inProgress: true});
    try {
      this.customremoteDataService.downloadCsv(csvArray);
      this.downloadEvent.emit({error: false, success: true, inProgress: false});
    } catch (error: any) {
      this.downloadEvent.emit({error: true, success: false, inProgress: false});
    }
  }

  initOpenedColumnMenuDialog(): void {
    this.columMenuComponent.keyLocalStorage = this.KEY_LOCAL_STORAGE_REMOTE_DATA_COLUMNS;
    this.columMenuComponent.columnsDefault = [
      ...Object.values(RemoteDataColumn)

        .filter(columnName => columnName !== RemoteDataColumn['COLUMNS_MENU'])
        .map(columnName => {
          return {name: columnName, selected: true};
        }),
    ];
    this.columMenuComponent.columns.splice(0, this.columMenuComponent.columns.length);
    this.columMenuComponent.columns.push(...this.columns);
  }

  setDisplayedColumns(columns: Array<Column>): void {
    let displayedColumnsTmp: Array<Column> = [];

    displayedColumnsTmp.push(...columns);

    if (RemoteDataColumn['COLUMNS_MENU'] && columns[columns.length - 1].name !== RemoteDataColumn['COLUMNS_MENU']) {
      displayedColumnsTmp.push({name: RemoteDataColumn['COLUMNS_MENU'], selected: true});
    }

    this.columns = [...columns];
    this.displayedColumns = displayedColumnsTmp.filter(column => column.selected).map(column => column.name);
  }

  loadCustomTemplate(): TemplateRef<any> | null {
    return this.customTemplate ? (this.customTemplate as TemplateRef<any>) : null;
  }
}