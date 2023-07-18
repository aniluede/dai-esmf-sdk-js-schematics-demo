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

/**  **/
import {Component, EventEmitter, Output} from '@angular/core';
import {CommandBarSearchFilterService} from './command-bar-search-filter.service';

@Component({
  selector: 'chip-list',
  templateUrl: './command-bar-search-chip-list.component.html',
  styleUrls: [],
})
export class CommandBarSearchChipListComponent {
  @Output() removeFilter = new EventEmitter<any>();

  constructor(public filterService: CommandBarSearchFilterService) {}

  triggerRemoveFilter(filter: any): void {
    this.removeFilter.emit(filter);
  }
}
