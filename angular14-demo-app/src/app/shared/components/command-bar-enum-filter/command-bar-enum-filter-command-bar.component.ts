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
import {Component, EventEmitter, Input, Output} from '@angular/core';

import {CommandBarEnumFilterFilterService} from './command-bar-enum-filter-filter.service';

import {SelectionModel} from '@angular/cdk/collections';

@Component({
  selector: 'command-bar',
  templateUrl: './command-bar-enum-filter-command-bar.component.html',
  styleUrls: [],
})
export class CommandBarEnumFilterCommandBarComponent {
  @Input() isMultipleSelectionEnabled = true;
  @Input() allowedCharacters: string = '';
  @Input() minNumberCharacters: number = 2;
  @Input() maxNumberCharacters: number = 50;
  @Input() searchHint?: string;
  @Input() KEY_LOCAL_STORAGE_COMMAND_BAR_ENUM_FILTER_CONFIG: string = '';

  @Output() applyFilters = new EventEmitter<void>();
  @Output() reloadFilter = new EventEmitter<void>();
  @Output() exportToCsv = new EventEmitter<void>();

  selection = new SelectionModel<any>(this.isMultipleSelectionEnabled, []);
  totalItems: number = 0;
  searchFocused: boolean = false;

  constructor(public filterService: CommandBarEnumFilterFilterService) {}

  triggerApplyFilters(): void {
    this.applyFilters.emit();
  }

  triggerExportToCsv(): void {
    this.exportToCsv.emit();
  }

  triggerReloadFilter(): void {
    this.reloadFilter.emit();
  }
}
