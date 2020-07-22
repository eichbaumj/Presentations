# %COPYRIGHT%
#
# This software is provided 'as-is', without any express or implied
# warranty. In no event will the authors be held liable for any damages
# arising from the use of this software.
#
# Permission is granted to anyone to use this software for any purpose,
# including commercial applications, and to alter it and redistribute it
# freely, subject to the following restrictions:
#
#    1. The origin of this software must not be misrepresented; you must not
#    claim that you wrote the original software. If you use this software
#    in a product, an acknowledgment in the product documentation would be
#    appreciated but is not required.
#
#    2. Altered source versions must be plainly marked as such, and must not be
#    misrepresented as being the original software.
#
#    3. This notice may not be removed or altered from any source
#    distribution.

import xry
import datetime

__contact__ = "%CONTACT%"
__version__ = "1"
__description__ = "create message category"

path = r'\Path to the database\Convo2020.db'

def main(image, node):
      
    dictionary = {}
    conn = xry.sqlite.connect(image, path)
    c = conn.cursor()
    c.execute('select [UID], [Name], [Phone] from friends')
    for row in c:
        dictionary[row[0]] = row[1]
        phone = row[2]
        name = row[1]

        item = image.create_item(xry.nodeids.views.contacts_view)
        prop = image.create_property(item, xry.nodeids.views.contacts_view.properties.name)
        prop.set_value(name)
        prop = image.create_property(item, xry.nodeids.views.contacts_view.properties.cell_nr)
        prop.set_value(phone)
        
    c.execute('select [UID], [Timestamp], [Direction], [Text], [Thread] from chat')
    for row in c:
        name = dictionary[row[0]]
        timestamp = datetime.datetime.utcfromtimestamp(row[1])
        direction = row[2]
        message = row[3]
        threadID = row[4]
        
        item = image.create_item(xry.nodeids.views.chat_view)

        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.uid)
        prop.set_value(name)
        
        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.direction)
        if direction:
            prop.set_value(xry.xrts.DIRECTION.OUTGOING)
        else:
            prop.set_value(xry.xrts.DIRECTION.INCOMING)

        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.time)
        prop.set_value(timestamp)

        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.text_body)
        prop.set_value(message)

        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.thread_id)
        prop.set_value(threadID)

        
        prop = image.create_property(item, xry.nodeids.views.chat_view.properties.related_application)
        prop.set_value("Conversation 2020")

        
