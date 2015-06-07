
1.0.7
=====
* added accessorType = readOnly

1.0.6
=====
* Bug Fixed : globalEventBus was missing. Now added.

1.0.5
=====
* Bug Fixed : chrome was not handling cloneNode. migrated to importNode

1.0.4
=====
* Fixed bug related to custom Event firing.

1.0.3
=====
* if this.template do not present, then do not reset this.$.innerHTML
* Update README.md
* added new accessorType
** string and json
* modified getter/setter
* added simple method for register element - pitana.register

1.0.2
=====
* All callback related to lifecycle can be empty.

1.0.1
=====
* Support for adding a new accessorType (pitana.accessorType)

1.0.0
=====
* Initial Release,
* Support accessor, methods, registerElement
* Support for custom Event bus
