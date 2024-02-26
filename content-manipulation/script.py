import re
from bs4 import BeautifulSoup

# Takes HTML content downloaded from Google Docs and sanitizes it.

def remove_empty_elements(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all empty elements
    empty_elements = soup.find_all(lambda tag: len(tag.text) == 0)

    # Remove the empty elements
    for element in empty_elements:
        element.decompose()

    # Get the modified HTML content
    modified_html = str(soup)
    
    return modified_html

def remove_class_attribute(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all elements with the 'class' attribute
    elements_with_class = soup.find_all(attrs={'class': True})

    # Remove the 'class' attribute from each element
    for element in elements_with_class:
        del element['class']

    # Get the modified HTML content
    modified_html = str(soup)
    
    return modified_html

def remove_id_attribute(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all elements with the 'id' attribute
    elements_with_id = soup.find_all(attrs={'id': True})

    # Remove the 'id' attribute from each element
    for element in elements_with_id:
        del element['id']

    # Get the modified HTML content
    modified_html = str(soup)
    
    return modified_html

def remove_style_attribute(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all elements with the 'style' attribute
    elements_with_style = soup.find_all(attrs={'style': True})

    # Remove the 'style' attribute from each element
    for element in elements_with_style:
        del element['style']

    # Get the modified HTML content
    modified_html = str(soup)
    
    return modified_html

def unwrap_spans(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    # Unwrap (remove) all span elements without losing content
    for span_tag in soup.find_all('span'):
        span_tag.unwrap()

    # Return the modified HTML
    return str(soup)

def modify_href(html_content):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all elements with the 'href' attribute
    elements_with_href = soup.find_all(href=True)

    # Modify the 'href' attribute for each element
    for element in elements_with_href:
        # Get the current value of the 'href' attribute
        current_href = element['href']

        # Use regular expressions to remove unwanted parts
        modified_href = re.sub(r'^https://www\.google\.com/url\?q=', '', current_href)
        modified_href = re.sub(r'\&.*$', '', modified_href)

        # Update the 'href' attribute with the modified value
        element['href'] = modified_href
        element['target'] = '_blank'

    # Get the modified HTML content
    modified_html = str(soup)
    
    return modified_html

def remove_classes_from_file(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as file:
        html_content = file.read()

    modified_html = remove_class_attribute(html_content)
    modified_html = remove_id_attribute(modified_html)
    modified_html = remove_style_attribute(modified_html)
    modified_html = unwrap_spans(modified_html)
    modified_html = modify_href(modified_html)
    modified_html = remove_empty_elements(modified_html)

    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(modified_html)

if __name__ == "__main__":
    # Replace 'input.html' and 'output.html' with your file names
    input_file_name = 'Page_AbouttheData.html'
    output_file_name = 'output.html'

    remove_classes_from_file(input_file_name, output_file_name)