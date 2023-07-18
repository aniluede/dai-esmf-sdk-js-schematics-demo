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
import {Component, EventEmitter, Input, Output, ViewChild} from '@angular/core';

import {CommandBarSearchFilterService} from './command-bar-search-filter.service';

import {SelectionModel} from '@angular/cdk/collections';

import {CommandBarSearchConfigMenuComponent} from './command-bar-search-config-menu.component';
import {Config} from './command-bar-search.component';

@Component({
  selector: 'command-bar',
  templateUrl: './command-bar-search-command-bar.component.html',
  styleUrls: [],
})
export class CommandBarSearchCommandBarComponent {
  @Input() isMultipleSelectionEnabled = true;
  @Input() allowedCharacters: string = '';
  @Input() minNumberCharacters: number = 2;
  @Input() maxNumberCharacters: number = 50;
  @Input() searchHint?: string;
  @Input() KEY_LOCAL_STORAGE_COMMAND_BAR_SEARCH_CONFIG: string = '';

  @Input() configs: Array<Config> = [];
  @Input() hasAdvancedSearch: boolean = this.filterService.stringColumns.length > 1;

  @Output() applyFilters = new EventEmitter<void>();
  @Output() reloadFilter = new EventEmitter<void>();
  @Output() exportToCsv = new EventEmitter<void>();

  @Output() setConfiguration = new EventEmitter<Array<Config>>();
  @ViewChild(CommandBarSearchConfigMenuComponent) private configurationComponent!: CommandBarSearchConfigMenuComponent;

  selection = new SelectionModel<any>(this.isMultipleSelectionEnabled, []);
  totalItems: number = 0;
  searchFocused: boolean = false;

  constructor(public filterService: CommandBarSearchFilterService) {}

  triggerApplyFilters(): void {
    this.applyFilters.emit();
  }

  triggerExportToCsv(): void {
    this.exportToCsv.emit();
  }

  triggerReloadFilter(): void {
    this.reloadFilter.emit();
  }

  triggerInitOpenedConfigurationDialog(): void {
    this.configurationComponent.keyLocalStorage = this.KEY_LOCAL_STORAGE_COMMAND_BAR_SEARCH_CONFIG;
    this.configurationComponent.configs.splice(0, this.configurationComponent.configs.length);
    this.configurationComponent.configs.push(...this.configs.map(config => ({...config})));
  }

  triggerSetConfiguration(config: Array<Config>): void {
    this.setConfiguration.emit(config);
  }
}
