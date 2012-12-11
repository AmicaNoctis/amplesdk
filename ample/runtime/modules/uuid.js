function fAmple_createUuid_rfc4122_v4 () {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
		/[xy]/g,
		function (c) {
			var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		}
	);
}
oAmple.createUuid = function () { return fAmple_createUuid_rfc4122_v4(); };
